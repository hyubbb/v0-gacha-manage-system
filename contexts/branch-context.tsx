"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Branch } from "@/types"

interface BranchContextType {
  branches: Branch[]
  loading: boolean
  addBranch: (branch: Omit<Branch, "id">) => Promise<void>
  updateBranch: (id: string, branch: Omit<Branch, "id">) => Promise<void>
  deleteBranch: (id: string) => Promise<void>
  refreshBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branches").select("*").order("name")

      if (error) throw error

      setBranches(data || [])
    } catch (error) {
      console.error("Error fetching branches:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()

    // 실시간 구독
    const subscription = supabase
      .channel("branches")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => {
        fetchBranches()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addBranch = async (branch: Omit<Branch, "id">) => {
    try {
      const { error } = await supabase.from("branches").insert([{ name: branch.name }])

      if (error) throw error
    } catch (error) {
      console.error("Error adding branch:", error)
      throw error
    }
  }

  const updateBranch = async (id: string, branch: Omit<Branch, "id">) => {
    try {
      const { error } = await supabase.from("branches").update({ name: branch.name }).eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error updating branch:", error)
      throw error
    }
  }

  const deleteBranch = async (id: string) => {
    try {
      const { error } = await supabase.from("branches").delete().eq("id", id)

      if (error) throw error
    } catch (error) {
      console.error("Error deleting branch:", error)
      throw error
    }
  }

  const refreshBranches = async () => {
    await fetchBranches()
  }

  return (
    <BranchContext.Provider value={{ branches, loading, addBranch, updateBranch, deleteBranch, refreshBranches }}>
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
