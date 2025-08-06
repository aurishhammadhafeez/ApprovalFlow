import { supabase, User, Organization, Workflow } from './supabase'

export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    return { data, error }
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Organizations
  static async createOrganization(orgData: Omit<Organization, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('organizations')
      .insert([orgData])
      .select()
      .single()
    return { data, error }
  }

  static async getOrganization(id: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  }

  // Workflows
  static async createWorkflow(workflowData: Omit<Workflow, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('workflows')
      .insert([workflowData])
      .select()
      .single()
    return { data, error }
  }

  static async getWorkflows(organizationId: string) {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    return { data, error }
  }

  static async updateWorkflow(id: string, updates: Partial<Workflow>) {
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  static async deleteWorkflow(id: string) {
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)
    return { error }
  }

  // Users - Use auth UID as the user ID
  static async createUser(userData: Omit<User, 'id' | 'created_at'>) {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { data: null, error: 'No authenticated user' }
      }

      // Use auth UID as the user ID
      const userRecord = {
        id: currentUser.id, // Use auth UID as user ID
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organization_id: userData.organization_id
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking existing user:', checkError)
      }

      if (existingUser) {
        // Update existing user with organization_id
        const { data, error } = await supabase
          .from('users')
          .update({ 
            organization_id: userData.organization_id,
            name: userData.name,
            role: userData.role
          })
          .eq('id', currentUser.id)
          .select()
          .single()
        return { data, error }
      } else {
        // Create new user with auth UID as ID
        const { data, error } = await supabase
          .from('users')
          .insert([userRecord])
          .select()
          .single()
        return { data, error }
      }
    } catch (error) {
      console.error('Error in createUser:', error)
      return { data: null, error: error as any }
    }
  }

  static async getUsers(organizationId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
    return { data, error }
  }

  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    return { data, error }
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  }

  // Helper method to get current user's organization
  static async getCurrentUserOrganization() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return { data: null, error: 'No authenticated user' }

      // Get user record using auth UID
      const { data: userData, error: userError } = await this.getUserById(currentUser.id)
      if (userError || !userData) return { data: null, error: userError || 'User not found' }

      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await this.getOrganization(userData.organization_id)
        return { data: orgData, error: orgError }
      }

      return { data: null, error: 'User has no organization' }
    } catch (error) {
      return { data: null, error: error as any }
    }
  }

  // Check if current user has an organization
  static async userHasOrganization() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return false

      const { data: userData, error } = await this.getUserById(currentUser.id)
      if (error || !userData) return false

      return !!userData.organization_id
    } catch (error) {
      console.error('Error checking user organization:', error)
      return false
    }
  }

  // Get current user with organization data
  static async getCurrentUserWithOrganization() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return { data: null, error: 'No authenticated user' }

      const { data: userData, error: userError } = await this.getUserById(currentUser.id)
      if (userError || !userData) return { data: null, error: userError || 'User not found' }

      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await this.getOrganization(userData.organization_id)
        if (orgError) return { data: null, error: orgError }

        return {
          data: {
            user: userData,
            organization: orgData
          },
          error: null
        }
      }

      return { data: { user: userData, organization: null }, error: null }
    } catch (error) {
      return { data: null, error: error as any }
    }
  }
} 