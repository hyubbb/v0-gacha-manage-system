export interface User {
  id: string
  username: string
  password: string
  role: "admin" | "branch"
  branchId?: string
  branchName?: string
}

export interface Branch {
  id: string
  name: string
}

export interface GachaItem {
  id: string
  name: string
  image: string
  totalStock: number
  branchAllocations: Record<string, number>
  createdAt: Date
}

export interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAdmin: boolean
}
