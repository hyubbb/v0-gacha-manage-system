"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useBranches } from "@/contexts/branch-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { User } from "@/types"
import { Plus, Edit, RotateCcw, Trash2, Building2 } from "lucide-react"

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const { branches, addBranch, updateBranch, deleteBranch } = useBranches()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingBranch, setEditingBranch] = useState<{ id: string; name: string } | null>(null)
  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    role: "branch" as "admin" | "branch",
    branchId: "",
  })
  const [branchFormData, setBranchFormData] = useState({
    name: "",
  })

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          branches (
            id,
            name
          )
        `)
        .order("created_at")

      if (error) throw error

      const formattedUsers: User[] = (data || []).map((user) => ({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        branchId: user.branch_id,
        branchName: user.branches?.name,
      }))

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return

    fetchUsers()

    // 실시간 구독
    const subscription = supabase
      .channel("users")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, () => {
        fetchUsers()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isAdmin])

  const resetUserForm = () => {
    setUserFormData({
      username: "",
      password: "",
      role: "branch",
      branchId: "",
    })
    setEditingUser(null)
  }

  const resetBranchForm = () => {
    setBranchFormData({
      name: "",
    })
    setEditingBranch(null)
  }

  const handleAddUser = () => {
    setIsUserModalOpen(true)
    resetUserForm()
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserFormData({
      username: user.username,
      password: user.password,
      role: user.role,
      branchId: user.branchId || "",
    })
    setIsUserModalOpen(true)
  }

  const handleAddBranch = () => {
    setIsBranchModalOpen(true)
    resetBranchForm()
  }

  const handleEditBranch = (branch: { id: string; name: string }) => {
    setEditingBranch(branch)
    setBranchFormData({
      name: branch.name,
    })
    setIsBranchModalOpen(true)
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (userFormData.role === "branch" && !userFormData.branchId) {
        alert("지점 담당자는 지점을 선택해야 합니다.")
        return
      }

      const userData = {
        username: userFormData.username,
        password: userFormData.password,
        role: userFormData.role,
        branch_id: userFormData.role === "branch" ? userFormData.branchId : null,
      }

      if (editingUser) {
        const { error } = await supabase.from("users").update(userData).eq("id", editingUser.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("users").insert([userData])

        if (error) throw error
      }

      setIsUserModalOpen(false)
      resetUserForm()
    } catch (error) {
      console.error("Error saving user:", error)
      alert("사용자 저장 중 오류가 발생했습니다.")
    }
  }

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBranch) {
        await updateBranch(editingBranch.id, { name: branchFormData.name })
      } else {
        await addBranch({ name: branchFormData.name })
      }

      setIsBranchModalOpen(false)
      resetBranchForm()
    } catch (error) {
      console.error("Error saving branch:", error)
      alert("지점 저장 중 오류가 발생했습니다.")
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (confirm("비밀번호를 초기화하시겠습니까?")) {
      try {
        const newPassword = "reset123"
        const { error } = await supabase.from("users").update({ password: newPassword }).eq("id", userId)

        if (error) throw error

        alert(`비밀번호가 "${newPassword}"로 초기화되었습니다.`)
      } catch (error) {
        console.error("Error resetting password:", error)
        alert("비밀번호 초기화 중 오류가 발생했습니다.")
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", userId)

        if (error) throw error
      } catch (error) {
        console.error("Error deleting user:", error)
        alert("사용자 삭제 중 오류가 발생했습니다.")
      }
    }
  }

  const handleDeleteBranch = async (branchId: string) => {
    const hasUsers = users.some((user) => user.branchId === branchId)
    if (hasUsers) {
      alert("이 지점에 연결된 사용자가 있어 삭제할 수 없습니다. 먼저 사용자를 삭제하거나 다른 지점으로 이동시켜주세요.")
      return
    }

    if (confirm("정말로 이 지점을 삭제하시겠습니까?")) {
      try {
        await deleteBranch(branchId)
      } catch (error) {
        console.error("Error deleting branch:", error)
        alert("지점 삭제 중 오류가 발생했습니다.")
      }
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">접근 권한이 없습니다.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg">데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">유저 및 지점 관리</h1>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">유저 관리</TabsTrigger>
          <TabsTrigger value="branches">지점 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">등록된 사용자</h2>
            <Button onClick={handleAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              유저 추가
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>아이디</TableHead>
                    <TableHead>비밀번호</TableHead>
                    <TableHead>권한</TableHead>
                    <TableHead>지점</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{user.password}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "관리자" : "지점 담당자"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.branchName || "-"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEditUser(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleResetPassword(user.id)}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          {user.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">등록된 지점</h2>
            <Button onClick={handleAddBranch}>
              <Plus className="mr-2 h-4 w-4" />
              지점 추가
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>지점 ID</TableHead>
                    <TableHead>지점명</TableHead>
                    <TableHead>연결된 사용자</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => {
                    const branchUsers = users.filter((user) => user.branchId === branch.id)
                    return (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.id}</TableCell>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell>
                          {branchUsers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {branchUsers.map((user) => (
                                <Badge key={user.id} variant="outline" className="text-xs">
                                  {user.username}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">없음</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditBranch(branch)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteBranch(branch.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={branchUsers.length > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 유저 추가/수정 모달 */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "유저 수정" : "새 유저 추가"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                value={userFormData.username}
                onChange={(e) => setUserFormData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="아이디를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <div>
              <Label htmlFor="role">권한</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value: "admin" | "branch") => setUserFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="branch">지점 담당자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userFormData.role === "branch" && (
              <div>
                <Label htmlFor="branch">지점</Label>
                <Select
                  value={userFormData.branchId}
                  onValueChange={(value) => setUserFormData((prev) => ({ ...prev, branchId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="지점을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
                취소
              </Button>
              <Button type="submit">{editingUser ? "수정" : "추가"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 지점 추가/수정 모달 */}
      <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                {editingBranch ? "지점 수정" : "새 지점 추가"}
              </div>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBranchSubmit} className="space-y-4">
            <div>
              <Label htmlFor="branchName">지점명</Label>
              <Input
                id="branchName"
                value={branchFormData.name}
                onChange={(e) => setBranchFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="지점명을 입력하세요 (예: 강남점)"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsBranchModalOpen(false)}>
                취소
              </Button>
              <Button type="submit">{editingBranch ? "수정" : "추가"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
