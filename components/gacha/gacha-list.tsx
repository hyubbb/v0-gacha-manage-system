"use client"
import { useAuth } from "@/contexts/auth-context"
import { useBranches } from "@/contexts/branch-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { GachaItem } from "@/types"
import { Trash2 } from "lucide-react"

interface GachaListProps {
  gachaItems: GachaItem[]
  onUpdateAllocation: (gachaId: string, branchId: string, newAmount: number) => void
  onDelete: (gachaId: string) => void
}

export default function GachaList({ gachaItems, onUpdateAllocation, onDelete }: GachaListProps) {
  const { user, isAdmin } = useAuth()
  const { branches } = useBranches()

  const canEditBranch = (branchId: string) => {
    if (isAdmin) return true
    return user?.branchId === branchId
  }

  const getTotalAllocated = (item: GachaItem) => {
    return Object.values(item.branchAllocations).reduce((sum, value) => sum + value, 0)
  }

  const getRemainingStock = (item: GachaItem) => {
    return item.totalStock - getTotalAllocated(item)
  }

  const handleAllocationChange = (gachaId: string, branchId: string, newValue: number, item: GachaItem) => {
    const currentAllocation = item.branchAllocations[branchId] || 0
    const otherAllocations = getTotalAllocated(item) - currentAllocation

    if (otherAllocations + newValue > item.totalStock) {
      alert("할당된 재고가 총 재고를 초과할 수 없습니다.")
      return
    }

    onUpdateAllocation(gachaId, branchId, newValue)
  }

  if (gachaItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">등록된 가챠가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-32 font-semibold text-center">상품 정보</TableHead>
            <TableHead className="w-24 text-center font-semibold">총 재고</TableHead>
            <TableHead className="w-24 text-center font-semibold">남은 재고</TableHead>
            {branches.map((branch) => (
              <TableHead key={branch.id} className="w-32 text-center font-semibold">
                {branch.name}
              </TableHead>
            ))}
            {isAdmin && <TableHead className="w-20 text-center font-semibold">작업</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {gachaItems.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-50">
              {/* 상품 정보 */}
              <TableCell className="py-4">
                <div className="flex flex-col items-center space-y-2 w-24">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 text-sm cursor-help" title={item.name}>
                      {item.name.length > 5 ? `${item.name.slice(0, 5)}...` : item.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </TableCell>

              {/* 총 재고 */}
              <TableCell className="text-center">
                <Badge variant="secondary" className="font-medium">
                  {item.totalStock}
                </Badge>
              </TableCell>

              {/* 할당됨 */}
              <TableCell className="text-center">
                <Badge variant="outline" className="font-medium">
                  {getTotalAllocated(item)}
                </Badge>
              </TableCell>

              {/* 남은 재고 */}
              <TableCell className="text-center">
                <Badge variant={getRemainingStock(item) > 0 ? "default" : "destructive"} className="font-medium">
                  {getRemainingStock(item)}
                </Badge>
              </TableCell>

              {/* 지점별 할당 입력 */}
              {branches.map((branch) => (
                <TableCell key={branch.id} className="text-center">
                  <Input
                    type="number"
                    min="0"
                    max={item.totalStock}
                    value={item.branchAllocations[branch.id] || 0}
                    onChange={(e) => handleAllocationChange(item.id, branch.id, Number(e.target.value), item)}
                    className="w-20 text-center mx-auto"
                    disabled={
                      !canEditBranch(branch.id) ||
                      (getRemainingStock(item) <= 0 && (item.branchAllocations[branch.id] || 0) === 0)
                    }
                  />
                </TableCell>
              ))}

              {/* 삭제 버튼 (관리자만) */}
              {isAdmin && (
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
