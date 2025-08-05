"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useBranches } from "@/contexts/branch-context"
import type { GachaItem } from "@/types"
import { Upload } from "lucide-react"

interface GachaAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (gacha: Omit<GachaItem, "id" | "createdAt">) => Promise<void>
}

export default function GachaAddModal({ isOpen, onClose, onAdd }: GachaAddModalProps) {
  const { user, isAdmin } = useAuth()
  const { branches } = useBranches()
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [totalStock, setTotalStock] = useState(0)
  const [branchAllocations, setBranchAllocations] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBranchAllocationChange = (branchId: string, value: number) => {
    setBranchAllocations((prev) => ({
      ...prev,
      [branchId]: value,
    }))
  }

  const getTotalAllocated = () => {
    return Object.values(branchAllocations).reduce((sum, value) => sum + value, 0)
  }

  const getRemainingStock = () => {
    return totalStock - getTotalAllocated()
  }

  const canAllocate = (branchId: string) => {
    if (isAdmin) return true
    return user?.branchId === branchId
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (getTotalAllocated() > totalStock) {
        alert("할당된 재고가 총 재고를 초과할 수 없습니다.")
        return
      }

      await onAdd({
        name,
        image: image || "/placeholder.svg?height=200&width=200&text=가챠+이미지",
        totalStock,
        branchAllocations,
      })

      // 폼 초기화
      setName("")
      setImage("")
      setTotalStock(0)
      setBranchAllocations({})
      onClose()
    } catch (error) {
      console.error("Error adding gacha:", error)
      alert("가챠 추가 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>새 가챠 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 왼쪽: 기본 정보 */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">가챠 이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="가챠 이름을 입력하세요"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalStock">총 재고 수량</Label>
                <Input
                  id="totalStock"
                  type="number"
                  min="0"
                  value={totalStock}
                  onChange={(e) => setTotalStock(Number(e.target.value))}
                  placeholder="총 재고 수량"
                  required
                  disabled={!isAdmin}
                />
              </div>

              <div>
                <Label htmlFor="image">가챠 이미지</Label>
                <div className="mt-2">
                  <input id="image" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("image")?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    이미지 업로드
                  </Button>
                  {image && (
                    <div className="mt-2">
                      <img src={image || "/placeholder.svg"} alt="Preview" className="w-32 h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 지점별 할당 */}
            <div className="space-y-4">
              <div>
                <Label>지점별 재고 할당</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  <div className="mb-4 text-sm">
                    <span className="font-medium">총 재고: {totalStock}</span>
                    <span className="ml-4 text-blue-600">할당됨: {getTotalAllocated()}</span>
                    <span className="ml-4 text-green-600">남은 재고: {getRemainingStock()}</span>
                  </div>

                  <div className="space-y-3">
                    {branches.map((branch) => (
                      <div key={branch.id} className="flex items-center justify-between">
                        <Label className="flex-1">{branch.name}</Label>
                        <Input
                          type="number"
                          min="0"
                          max={totalStock}
                          value={branchAllocations[branch.id] || 0}
                          onChange={(e) => handleBranchAllocationChange(branch.id, Number(e.target.value))}
                          className="w-24"
                          disabled={!canAllocate(branch.id) || getRemainingStock() <= 0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "추가 중..." : "추가"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
