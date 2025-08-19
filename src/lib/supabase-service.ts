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

  static async createWorkflowSteps(steps: Omit<WorkflowStep, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('workflow_steps')
      .insert(steps)
      .select()
    return { data, error }
  }

  static async createWorkflowWithSteps(workflowData: Omit<Workflow, 'id' | 'created_at'>, steps: Array<{ name: string, approver: string, required: boolean }>) {
    try {
      // First create the workflow
      const { data: workflow, error: workflowError } = await this.createWorkflow(workflowData)
      if (workflowError) {
        return { data: null, error: workflowError }
      }

      // Then create the workflow steps
      const workflowSteps = steps.map((step, index) => ({
        workflow_id: workflow.id,
        name: step.name,
        approver_email: step.approver,
        order_index: index + 1,
        required: step.required
      }))

      const { data: stepsData, error: stepsError } = await this.createWorkflowSteps(workflowSteps)
      if (stepsError) {
        // If steps creation fails, we should delete the workflow to maintain consistency
        await this.deleteWorkflow(workflow.id)
        return { data: null, error: stepsError }
      }

      return { 
        data: { 
          workflow, 
          steps: stepsData 
        }, 
        error: null 
      }
    } catch (error) {
      return { data: null, error: error as any }
    }
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
        
        if (error) {
          console.error('Error updating existing user:', error)
          return { data: null, error: error.message }
        }
        
        return { data, error: null }
      } else {
        // Try to create new user with auth UID as ID
        const { data, error } = await supabase
          .from('users')
          .insert([userRecord])
          .select()
          .single()
        
        if (error) {
          console.error('Error creating new user:', error)
          
          // If the trigger failed, try to create manually
          if (error.message.includes('new row violates row-level security policy')) {
            console.log('RLS policy blocked user creation, trying manual creation...')
            
            // Call the manual creation function
            const { data: manualData, error: manualError } = await supabase
              .rpc('create_user_if_not_exists', {
                user_id: currentUser.id,
                user_email: userData.email,
                user_name: userData.name || 'User'
              })
            
            if (manualError) {
              console.error('Manual user creation also failed:', manualError)
              return { data: null, error: 'Failed to create user record. Please try again.' }
            }
            
            // If manual creation succeeded, get the user data
            const { data: finalUser, error: finalError } = await this.getUserById(currentUser.id)
            return { data: finalUser, error: finalError }
          }
          
          return { data: null, error: error.message }
        }
        
        return { data, error: null }
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