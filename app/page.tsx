"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useBranches } from "@/contexts/branch-context"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import GachaAddModal from "@/components/gacha/gacha-add-modal"
import GachaList from "@/components/gacha/gacha-list"
import type { GachaItem } from "@/types"

export default function HomePage() {
  const { isAdmin } = useAuth()
  const { branches } = useBranches()
  const [gachaItems, setGachaItems] = useState<GachaItem[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    const savedItems = localStorage.getItem("gachaItems")
    if (savedItems) {
      setGachaItems(JSON.parse(savedItems))
    } else {
      // 초기 샘플 데이터
      const sampleItems: GachaItem[] = [
        {
          id: "1",
          name: "레어 피규어 세트",
          image: "/placeholder.svg?height=200&width=200&text=레어+피규어",
          totalStock: 100,
          branchAllocations: {
            seoul: 30,
            busan: 25,
            daegu: 20,
            incheon: 15,
            gwangju: 10,
          },
          createdAt: new Date(),
        },
        {
          id: "2",
          name: "한정판 카드팩",
          image: "/placeholder.svg?height=200&width=200&text=한정판+카드",
          totalStock: 200,
          branchAllocations: {
            seoul: 50,
            busan: 40,
            daegu: 35,
            incheon: 35,
            gwangju: 40,
          },
          createdAt: new Date(),
        },
      ]
      setGachaItems(sampleItems)
      localStorage.setItem("gachaItems", JSON.stringify(sampleItems))
    }
  }, [])

  // 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (gachaItems.length > 0) {
      localStorage.setItem("gachaItems", JSON.stringify(gachaItems))
    }
  }, [gachaItems])

  const handleAddGacha = (newGacha: Omit<GachaItem, "id" | "createdAt">) => {
    const gacha: GachaItem = {
      ...newGacha,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    setGachaItems((prev) => [...prev, gacha])
  }

  const handleUpdateAllocation = (gachaId: string, branchId: string, newAmount: number) => {
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
          : item,
      ),
    )
  }

  const handleDeleteGacha = (gachaId: string) => {
    if (confirm("정말로 이 가챠를 삭제하시겠습니까?")) {
      setGachaItems((prev) => prev.filter((item) => item.id !== gachaId))
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">가챠 재고 관리</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          가챠 추가
        </Button>
      </div>

      {gachaItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">등록된 가챠가 없습니다.</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />첫 번째 가챠 추가하기
          </Button>
        </div>
      ) : (
        <GachaList
          gachaItems={gachaItems}
          branches={branches}
          onUpdateAllocation={handleUpdateAllocation}
          onDelete={handleDeleteGacha}
        />
      )}

      <GachaAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddGacha}
        branches={branches}
      />
    </div>
  )
}
