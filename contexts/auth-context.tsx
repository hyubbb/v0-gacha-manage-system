"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User, AuthContextType } from "@/types"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Fallback 사용자 데이터 (Supabase 연결 실패 시 사용)
const fallbackUsers: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    id: "2",
    username: "branch_seoul",
    password: "seoul123",
    role: "branch",
    branchId: "seoul",
    branchName: "서울점",
  },
  {
    id: "3",
    username: "branch_busan",
    password: "busan123",
    role: "branch",
    branchId: "busan",
    branchName: "부산점",
  },
  {
    id: "4",
    username: "branch_daegu",
    password: "daegu123",
    role: "branch",
    branchId: "daegu",
    branchName: "대구점",
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [useSupabase, setUseSupabase] = useState(true)

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 복원
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const loginWithSupabase = async (username: string, password: string): Promise<User | null> => {
    try {
      console.log("🔍 Supabase 로그인 시도:", { username })

      // 먼저 사용자만 조회
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .single()

      if (userError) {
        console.error("❌ 사용자 조회 에러:", userError)
        return null
      }

      if (!userData) {
        console.log("❌ 사용자를 찾을 수 없음")
        return null
      }

      console.log("✅ 사용자 찾음:", userData)

      // 지점 정보가 있으면 조회
      let branchName = undefined
      if (userData.branch_id) {
        const { data: branchData, error: branchError } = await supabase
          .from("branches")
          .select("name")
          .eq("id", userData.branch_id)
          .single()

        if (!branchError && branchData) {
          branchName = branchData.name
        }
      }

      const user: User = {
        id: userData.id,
        username: userData.username,
        password: userData.password,
        role: userData.role,
        branchId: userData.branch_id,
        branchName,
      }

      console.log("✅ 로그인 성공:", user)
      return user
    } catch (error) {
      console.error("❌ Supabase 로그인 에러:", error)
      return null
    }
  }

  const loginWithFallback = (username: string, password: string): User | null => {
    console.log("🔄 Fallback 로그인 시도:", { username })
    const foundUser = fallbackUsers.find((u) => u.username === username && u.password === password)
    if (foundUser) {
      console.log("✅ Fallback 로그인 성공:", foundUser)
      return foundUser
    }
    console.log("❌ Fallback 로그인 실패")
    return null
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      let userData: User | null = null

      if (useSupabase) {
        userData = await loginWithSupabase(username, password)

        // Supabase 로그인 실패 시 fallback 사용
        if (!userData) {
          console.log("🔄 Supabase 실패, Fallback으로 전환")
          setUseSupabase(false)
          userData = loginWithFallback(username, password)
        }
      } else {
        userData = loginWithFallback(username, password)
      }

      if (userData) {
        setUser(userData)
        localStorage.setItem("currentUser", JSON.stringify(userData))
        return true
      }

      return false
    } catch (error) {
      console.error("❌ 로그인 전체 에러:", error)

      // 에러 발생 시 fallback 시도
      const fallbackUser = loginWithFallback(username, password)
      if (fallbackUser) {
        setUser(fallbackUser)
        localStorage.setItem("currentUser", JSON.stringify(fallbackUser))
        setUseSupabase(false)
        return true
      }

      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  const isAdmin = user?.role === "admin"

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
      {/* 디버그 정보 표시 */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          DB: {useSupabase ? "Supabase" : "Fallback"}
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
