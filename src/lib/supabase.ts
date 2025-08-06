import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface User {
  id: string
  email: string
  name?: string
  role?: string
  organization_id?: string
  created_at?: string
}

export interface Organization {
  id: string
  name: string
  industry?: string
  size?: string
  admin_id?: string
  created_at?: string
}

export interface Workflow {
  id: string
  name: string
  department?: string
  type?: string
  description?: string
  organization_id?: string
  created_by?: string
  created_at?: string
} 