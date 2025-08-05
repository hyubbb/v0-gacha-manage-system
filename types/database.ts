export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          username: string
          password: string
          role: "admin" | "branch"
          branch_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          username: string
          password: string
          role: "admin" | "branch"
          branch_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          password?: string
          role?: "admin" | "branch"
          branch_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gacha_items: {
        Row: {
          id: string
          name: string
          image: string | null
          total_stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          image?: string | null
          total_stock: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          image?: string | null
          total_stock?: number
          created_at?: string
          updated_at?: string
        }
      }
      branch_allocations: {
        Row: {
          id: string
          gacha_item_id: string
          branch_id: string
          allocated_stock: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gacha_item_id: string
          branch_id: string
          allocated_stock: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gacha_item_id?: string
          branch_id?: string
          allocated_stock?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
