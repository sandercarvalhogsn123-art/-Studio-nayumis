import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evkaeyhqmlguwcwctdod.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DBJp5ah8bpuefqS4uIiVcg_eldEZ3Dk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
