"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Package, Users, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  const navigation = [
    {
      name: "재고 관리",
      href: "/",
      icon: Package,
      current: pathname === "/",
    },
    ...(isAdmin
      ? [
          {
            name: "유저 관리",
            href: "/users",
            icon: Users,
            current: pathname === "/users",
          },
        ]
      : []),
  ]

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-xl font-bold">가챠 재고 관리</h1>
      </div>

      <div className="flex-1 flex flex-col">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  item.current ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="mb-3">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-gray-400">{user?.role === "admin" ? "관리자" : user?.branchName}</p>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
