"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useGacha } from "@/contexts/gacha-context";
import GachaAddModal from "@/components/gacha/gacha-add-modal";
import GachaList from "@/components/gacha/gacha-list";

export default function HomePage() {
  const {
    gachaItems,
    loading,
    addGachaItem,
    updateAllocation,
    updateTotalStock,
    deleteGachaItem,
  } = useGacha();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-lg'>데이터를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>가챠 재고 관리</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          가챠 추가
        </Button>
      </div>

      {gachaItems.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500 mb-4'>등록된 가챠가 없습니다.</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className='mr-2 h-4 w-4' />첫 번째 가챠 추가하기
          </Button>
        </div>
      ) : (
        <GachaList
          gachaItems={gachaItems}
          onUpdateAllocation={updateAllocation}
          onUpdateTotalStock={updateTotalStock}
          onDelete={deleteGachaItem}
        />
      )}

      <GachaAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addGachaItem}
      />
    </div>
  );
}
