"use client"

import type React from "react"

import { Inter } from "next/font/google"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { BranchProvider } from "@/contexts/branch-context"
import LoginForm from "@/components/login-form"
import Sidebar from "@/components/layout/sidebar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

function AppContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (!user) {
    return <LoginForm />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BranchProvider>
      <AuthProvider>
        <AppContent>{children}</AppContent>
      </AuthProvider>
    </BranchProvider>
  )
}
