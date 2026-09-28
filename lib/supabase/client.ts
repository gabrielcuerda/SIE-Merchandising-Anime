import { createClient } from '@supabase/supabase-js'
import { requireSupabaseEnv } from '@/lib/supabase/env'

const [supabaseUrl, supabaseKey] = requireSupabaseEnv()

export const supabase = createClient(supabaseUrl, supabaseKey)
