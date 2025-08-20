import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

export interface WorkflowStep {
  id: string
  workflow_id: string
  name: string
  approver_email?: string
  order_index: number
  required: boolean
  created_at?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: Record<string, any>
  created_at?: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  organization_id: string
  assigned_by?: string
  created_at?: string
}

export interface UserWithRoles extends User {
  roles?: Role[]
}

export interface Invitation {
  id: string
  email: string
  name?: string
  role_id: string
  organization_id: string
  invited_by?: string
  token: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_at: string
  accepted_at?: string
} 