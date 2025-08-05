import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log("🔧 Supabase 설정:", {
  url: supabaseUrl ? "✅ 설정됨" : "❌ 없음",
  key: supabaseAnonKey ? "✅ 설정됨" : "❌ 없음",
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 연결 테스트
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1)
    if (error) {
      console.error("❌ Supabase 연결 테스트 실패:", error)
      return false
    }
    console.log("✅ Supabase 연결 성공")
    return true
  } catch (error) {
    console.error("❌ Supabase 연결 에러:", error)
    return false
  }
}

// 클라이언트 사이드에서 사용할 Supabase 클라이언트
export const createClientSupabase = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
