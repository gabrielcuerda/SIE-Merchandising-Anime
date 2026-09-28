import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './env'

const { url, key } = getSupabaseEnv()

export const supabase = createClient(url, key)
