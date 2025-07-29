import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jyfabmwvoitjjduolvkc.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZmFibXd2b2l0ampkdW9sdmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3ODI5NzAsImV4cCI6MjA2ODM1ODk3MH0.W_BpRoFKBJDdwnTNPdsNnNQaCpYS16WnONHqSHNiTSI"

export const supabase = createClient(supabaseUrl, supabaseKey);

