"use client"

import { useState, useEffect } from "react"
import { supabase, testSupabaseConnection } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugPage() {
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [error, setError] = useState<string>("")

  const checkConnection = async () => {
    setError("")
    const isConnected = await testSupabaseConnection()
    setConnectionStatus(isConnected)
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*")
      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      setError(`사용자 조회 실패: ${err.message}`)
    }
  }

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*")
      if (error) throw error
      setBranches(data || [])
    } catch (err: any) {
      setError(`지점 조회 실패: ${err.message}`)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">디버그 페이지</h1>

      <Card>
        <CardHeader>
          <CardTitle>Supabase 연결 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <span>연결 상태:</span>
            {connectionStatus === null ? (
              <Badge variant="secondary">확인 중...</Badge>
            ) : connectionStatus ? (
              <Badge variant="default">✅ 연결됨</Badge>
            ) : (
              <Badge variant="destructive">❌ 연결 실패</Badge>
            )}
          </div>

          <div className="space-x-2">
            <Button onClick={checkConnection}>연결 테스트</Button>
            <Button onClick={fetchUsers}>사용자 조회</Button>
            <Button onClick={fetchBranches}>지점 조회</Button>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
        </CardContent>
      </Card>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록 ({users.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="p-2 border rounded">
                  <div className="font-medium">{user.username}</div>
                  <div className="text-sm text-gray-600">
                    역할: {user.role} | 지점 ID: {user.branch_id || "없음"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {branches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>지점 목록 ({branches.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {branches.map((branch) => (
                <div key={branch.id} className="p-2 border rounded">
                  <div className="font-medium">{branch.name}</div>
                  <div className="text-sm text-gray-600">ID: {branch.id}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>환경 변수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ 설정됨" : "❌ 없음"}</div>
            <div>
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ 설정됨" : "❌ 없음"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
