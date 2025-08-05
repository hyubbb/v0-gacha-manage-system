"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("🚀 로그인 시도:", { username, password })

    try {
      const success = await login(username, password)

      if (success) {
        console.log("✅ 로그인 성공!")
        // 로그인 성공 시 페이지 새로고침으로 메인 페이지로 이동
        window.location.reload()
      } else {
        console.log("❌ 로그인 실패")
        setError("아이디 또는 비밀번호가 올바르지 않습니다.")
      }
    } catch (err) {
      console.error("❌ 로그인 에러:", err)
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  // 빠른 로그인 버튼
  const quickLogin = async (user: { username: string; password: string; label: string }) => {
    setUsername(user.username)
    setPassword(user.password)
    setError("")
    setIsLoading(true)

    try {
      const success = await login(user.username, user.password)
      if (success) {
        window.location.reload()
      } else {
        setError("로그인에 실패했습니다.")
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const testAccounts = [
    { username: "admin", password: "admin123", label: "관리자" },
    { username: "branch_seoul", password: "seoul123", label: "서울점" },
    { username: "branch_busan", password: "busan123", label: "부산점" },
    { username: "branch_daegu", password: "daegu123", label: "대구점" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">가챠 재고 관리</CardTitle>
          <CardDescription>로그인하여 시스템에 접속하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">아이디</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-sm text-gray-600 mb-3">
              <p className="font-semibold">빠른 로그인:</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {testAccounts.map((account) => (
                <Button
                  key={account.username}
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin(account)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold mb-2">테스트 계정:</p>
            <div className="space-y-1">
              <p>관리자: admin / admin123</p>
              <p>서울점: branch_seoul / seoul123</p>
              <p>부산점: branch_busan / busan123</p>
              <p>대구점: branch_daegu / daegu123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
