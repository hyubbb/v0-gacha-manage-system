"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Branch } from "@/types"

interface BranchContextType {
  branches: Branch[]
  addBranch: (branch: Omit<Branch, "id">) => void
  updateBranch: (id: string, branch: Omit<Branch, "id">) => void
  deleteBranch: (id: string) => void
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

// 초기 지점 데이터
const initialBranches: Branch[] = [
  { id: "seoul", name: "서울점" },
  { id: "busan", name: "부산점" },
  { id: "daegu", name: "대구점" },
  { id: "incheon", name: "인천점" },
  { id: "gwangju", name: "광주점" },
]

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches)

  useEffect(() => {
    const savedBranches = localStorage.getItem("branches")
    if (savedBranches) {
      setBranches(JSON.parse(savedBranches))
    } else {
      localStorage.setItem("branches", JSON.stringify(initialBranches))
    }
  }, [])

  useEffect(() => {
    if (branches.length > 0) {
      localStorage.setItem("branches", JSON.stringify(branches))
    }
  }, [branches])

  const addBranch = (branch: Omit<Branch, "id">) => {
    const newBranch: Branch = {
      ...branch,
      id: Date.now().toString(),
    }
    setBranches((prev) => [...prev, newBranch])
  }

  const updateBranch = (id: string, branch: Omit<Branch, "id">) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...branch, id } : b)))
  }

  const deleteBranch = (id: string) => {
    setBranches((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <BranchContext.Provider value={{ branches, addBranch, updateBranch, deleteBranch }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranches() {
  const context = useContext(BranchContext)
  if (context === undefined) {
    throw new Error("useBranches must be used within a BranchProvider")
  }
  return context
}
