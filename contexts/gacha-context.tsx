"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { GachaItem } from "@/types";

interface GachaContextType {
  gachaItems: GachaItem[];
  loading: boolean;
  addGachaItem: (item: Omit<GachaItem, "id" | "createdAt">) => Promise<void>;
  updateAllocation: (
    gachaId: string,
    branchId: string,
    newAmount: number
  ) => Promise<void>;
  updateTotalStock: (gachaId: string, newTotalStock: number) => Promise<void>;
  deleteGachaItem: (id: string) => Promise<void>;
  refreshGachaItems: () => Promise<void>;
}

const GachaContext = createContext<GachaContextType | undefined>(undefined);

export function GachaProvider({ children }: { children: ReactNode }) {
  const [gachaItems, setGachaItems] = useState<GachaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGachaItems = async () => {
    try {
      const { data: items, error: itemsError } = await supabase
        .from("gacha_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;

      const { data: allocations, error: allocationsError } = await supabase
        .from("branch_allocations")
        .select("*");

      if (allocationsError) throw allocationsError;

      const formattedItems: GachaItem[] = (items || []).map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image || "",
        totalStock: item.total_stock,
        branchAllocations: allocations
          .filter((alloc) => alloc.gacha_item_id === item.id)
          .reduce(
            (acc, alloc) => ({
              ...acc,
              [alloc.branch_id]: alloc.allocated_stock,
            }),
            {}
          ),
        createdAt: new Date(item.created_at),
      }));

      setGachaItems(formattedItems);
    } catch (error) {
      console.error("Error fetching gacha items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGachaItems();

    // 실시간 구독 개선
    const itemsSubscription = supabase
      .channel("gacha_items_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gacha_items",
        },
        (payload) => {
          console.log("🔄 가챠 아이템 변경 감지:", payload);
          fetchGachaItems();
        }
      )
      .subscribe((status) => {
        console.log("📡 가챠 아이템 구독 상태:", status);
      });

    const allocationsSubscription = supabase
      .channel("branch_allocations_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "branch_allocations",
        },
        (payload) => {
          console.log("🔄 지점 할당 변경 감지:", payload);
          fetchGachaItems();
        }
      )
      .subscribe((status) => {
        console.log("📡 지점 할당 구독 상태:", status);
      });

    return () => {
      console.log("🔌 실시간 구독 해제");
      itemsSubscription.unsubscribe();
      allocationsSubscription.unsubscribe();
    };
  }, []);

  const addGachaItem = async (item: Omit<GachaItem, "id" | "createdAt">) => {
    try {
      console.log("🚀 가챠 아이템 추가 시작:", item.name);

      const { data: newItem, error: itemError } = await supabase
        .from("gacha_items")
        .insert([
          {
            name: item.name,
            image: item.image,
            total_stock: item.totalStock,
          },
        ])
        .select()
        .single();

      if (itemError) throw itemError;
      console.log("✅ 가챠 아이템 DB 추가 완료:", newItem);

      // 지점별 할당 추가
      const allocations = Object.entries(item.branchAllocations).map(
        ([branchId, stock]) => ({
          gacha_item_id: newItem.id,
          branch_id: branchId,
          allocated_stock: stock,
        })
      );

      if (allocations.length > 0) {
        const { error: allocError } = await supabase
          .from("branch_allocations")
          .insert(allocations);

        if (allocError) throw allocError;
        console.log("✅ 지점 할당 DB 추가 완료:", allocations);
      }

      // 낙관적 업데이트: 즉시 로컬 상태 업데이트
      const newGachaItem: GachaItem = {
        id: newItem.id,
        name: newItem.name,
        image: newItem.image || "",
        totalStock: newItem.total_stock,
        branchAllocations: item.branchAllocations,
        createdAt: new Date(newItem.created_at),
      };

      setGachaItems((prev) => [newGachaItem, ...prev]);
      console.log("🔄 로컬 상태 즉시 업데이트 완료");

      // 서버 데이터와 동기화 (백그라운드)
      setTimeout(() => {
        console.log("🔄 서버 데이터 재동기화");
        fetchGachaItems();
      }, 1000);
    } catch (error) {
      console.error("❌ 가챠 아이템 추가 실패:", error);
      throw error;
    }
  };

  const updateAllocation = async (
    gachaId: string,
    branchId: string,
    newAmount: number
  ) => {
    try {
      console.log("🔄 수량 업데이트 시작:", { gachaId, branchId, newAmount });

      // upsert 사용 (insert or update)
      console.log("📝 DB 업데이트 데이터:", {
        gacha_item_id: gachaId,
        branch_id: branchId,
        allocated_stock: newAmount,
      });

      const { data, error } = await supabase.from("branch_allocations").upsert(
        {
          gacha_item_id: gachaId,
          branch_id: branchId,
          allocated_stock: newAmount,
        },
        {
          onConflict: "gacha_item_id,branch_id",
          ignoreDuplicates: false,
        }
      );

      if (error) {
        console.error("❌ DB 에러:", error);
        console.error("❌ 에러 코드:", error.code);
        console.error("❌ 에러 메시지:", error.message);
        throw error;
      }

      console.log("✅ DB 응답 데이터:", data);

      console.log("✅ DB 업데이트 완료");

      // DB 성공 후 로컬 상태 업데이트
      setGachaItems((prev) =>
        prev.map((item) =>
          item.id === gachaId
            ? {
                ...item,
                branchAllocations: {
                  ...item.branchAllocations,
                  [branchId]: newAmount,
                },
              }
            : item
        )
      );
      console.log("🔄 로컬 상태 업데이트 완료");
    } catch (error) {
      console.error("❌ 수량 업데이트 실패:", error);
      throw error;
    }
  };

  const updateTotalStock = async (gachaId: string, newTotalStock: number) => {
    try {
      console.log("🔄 총재고 업데이트 시작:", { gachaId, newTotalStock });

      // DB 업데이트
      const { error } = await supabase
        .from("gacha_items")
        .update({ total_stock: newTotalStock })
        .eq("id", gachaId);

      if (error) {
        console.error("❌ DB 에러:", error);
        throw error;
      }

      console.log("✅ DB 업데이트 완료");

      // DB 성공 후 로컬 상태 업데이트
      setGachaItems((prev) =>
        prev.map((item) =>
          item.id === gachaId
            ? {
                ...item,
                totalStock: newTotalStock,
              }
            : item
        )
      );
      console.log("🔄 로컬 상태 업데이트 완료");
    } catch (error) {
      console.error("❌ 총재고 업데이트 실패:", error);
      throw error;
    }
  };

  const deleteGachaItem = async (id: string) => {
    try {
      console.log("🗑️ 가챠 아이템 삭제 시작:", id);

      // DB에서 삭제 먼저 수행
      const { error } = await supabase
        .from("gacha_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      console.log("✅ DB에서 삭제 완료");

      // DB 성공 후 로컬 상태에서 제거
      setGachaItems((prev) => prev.filter((item) => item.id !== id));
      console.log("🔄 로컬 상태에서 제거 완료");
    } catch (error) {
      console.error("❌ 가챠 아이템 삭제 실패:", error);
      throw error;
    }
  };

  const refreshGachaItems = async () => {
    await fetchGachaItems();
  };

  return (
    <GachaContext.Provider
      value={{
        gachaItems,
        loading,
        addGachaItem,
        updateAllocation,
        updateTotalStock,
        deleteGachaItem,
        refreshGachaItems,
      }}
    >
      {children}
    </GachaContext.Provider>
  );
}

export function useGacha() {
  const context = useContext(GachaContext);
  if (context === undefined) {
    throw new Error("useGacha must be used within a GachaProvider");
  }
  return context;
}
