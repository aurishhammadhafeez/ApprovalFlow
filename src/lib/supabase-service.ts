import { supabase, User, Organization, Workflow, WorkflowStep } from './supabase'

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
            name: userData.name
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

  // Check if current user is admin in their organization
  static async isCurrentUserAdmin() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return false

      const { data: userData, error } = await supabase
        .from('users')
        .select(`
          organization_id,
          user_roles!inner (
            roles!inner (
              name
            )
          )
        `)
        .eq('id', currentUser.id)
        .single()

      if (error || !userData) return false

      const isAdmin = userData.user_roles?.some(ur => (ur.roles as any)?.name === 'admin')
      return isAdmin
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Get current user with organization data and role
  static async getCurrentUserWithOrganization() {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) return { data: null, error: 'No authenticated user' }

      // Get user data with role information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          user_roles!inner (
            role_id,
            roles!inner (
              name,
              description,
              permissions
            )
          )
        `)
        .eq('id', currentUser.id)
        .single()

      if (userError || !userData) return { data: null, error: userError || 'User not found' }

      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await this.getOrganization(userData.organization_id)
        if (orgError) return { data: null, error: orgError }

        // Extract role information
        const userRole = userData.user_roles?.[0]?.roles?.name || 'user'
        const userWithRole = {
          ...userData,
          role: userRole
        }

        return {
          data: {
            user: userWithRole,
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

  // Check if email is already in use (across all organizations)
  static async isEmailInUse(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('email', email)
      .maybeSingle()
    
    if (error) {
      console.error('Error checking email:', error)
      return { isInUse: false, error }
    }
    
    return { isInUse: !!data, organizationId: data?.organization_id, error: null }
  }

  // Add user to organization (only admins can do this)
  static async addUserToOrganization(userData: { email: string; name: string; role: string }, organizationId: string) {
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { data: null, error: 'Authentication required' }
      }

      // Check if email is already in use
      const { isInUse, organizationId: existingOrgId } = await this.isEmailInUse(userData.email)
      if (isInUse) {
        if (existingOrgId === organizationId) {
          return { data: null, error: 'User is already in this organization' }
        } else {
          return { data: null, error: 'Email is already in use by another organization' }
        }
      }

      // Get the role ID for the specified role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', userData.role)
        .single()

      if (roleError || !roleData) {
        return { data: null, error: 'Invalid role specified' }
      }

      // Create the user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          name: userData.name,
          organization_id: organizationId
        }])
        .select()
        .single()

      if (userError) {
        console.error('Error creating user:', userError)
        return { data: null, error: userError.message }
      }

      // Assign the role to the user
      const { error: roleAssignmentError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: newUser.id,
          role_id: roleData.id,
          organization_id: organizationId,
          assigned_by: currentUser.id
        }])

      if (roleAssignmentError) {
        console.error('Error assigning role:', roleAssignmentError)
        // If role assignment fails, delete the user to maintain consistency
        await this.deleteUser(newUser.id)
        return { data: null, error: 'Failed to assign role to user' }
      }

      return { data: newUser, error: null }
    } catch (error) {
      console.error('Error adding user to organization:', error)
      return { data: null, error: error as any }
    }
  }

  // Get users with their roles for an organization
  static async getUsersWithRoles(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_roles (
            role_id,
            roles (
              name,
              description,
              permissions
            )
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users with roles:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching users with roles:', error)
      return { data: null, error: error as any }
    }
  }

  // Delete user (only admins can do this)
  static async deleteUser(userId: string) {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { error: 'Authentication required' }
      }

      // Check if current user is admin
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        return { error: 'Insufficient permissions. Only admins can delete users.' }
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting user:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { error: error as any }
    }
  }

  // Create invitation (only admins can do this)
  static async createInvitation(invitationData: { email: string; name?: string; role: string }, organizationId: string) {
    try {
      // Check if current user is admin
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { data: null, error: 'Authentication required' }
      }

      // Verify admin permissions
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        return { data: null, error: 'Insufficient permissions. Only admins can create invitations.' }
      }

      // Check if email is already in use
      const { isInUse, organizationId: existingOrgId } = await this.isEmailInUse(invitationData.email)
      if (isInUse) {
        if (existingOrgId === organizationId) {
          return { data: null, error: 'User is already in this organization' }
        } else {
          return { data: null, error: 'Email is already in use by another organization' }
        }
      }

      // Get the role ID for the specified role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', invitationData.role)
        .single()

      if (roleError || !roleData) {
        return { data: null, error: 'Invalid role specified' }
      }

      // Generate secure token
      const token = crypto.randomUUID()
      
      // Set expiration (7 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      // Create invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert([{
          email: invitationData.email.trim(),
          name: invitationData.name?.trim(),
          role_id: roleData.id,
          organization_id: organizationId,
          invited_by: currentUser.id,
          token: token,
          expires_at: expiresAt.toISOString()
        }])
        .select()
        .single()

      if (invitationError) {
        console.error('Error creating invitation:', invitationError)
        return { data: null, error: invitationError.message }
      }

      return { data: invitation, error: null }
    } catch (error) {
      console.error('Error creating invitation:', error)
      return { data: null, error: error as any }
    }
  }

  // Get invitations for an organization
  static async getInvitations(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          roles (
            name,
            description
          ),
          users!invitations_invited_by_fkey (
            name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invitations:', error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching invitations:', error)
      return { data: null, error: error as any }
    }
  }

  // Cancel invitation (only admins can do this)
  static async cancelInvitation(invitationId: string) {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { error: 'Authentication required' }
      }

      // Check if current user is admin
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        return { error: 'Insufficient permissions. Only admins can cancel invitations.' }
      }

      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        console.error('Error canceling invitation:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error canceling invitation:', error)
      return { error: error as any }
    }
  }

  // Accept invitation (public method for invited users)
  static async acceptInvitation(token: string, userData: { email: string; name: string; password: string }) {
    try {
      // Find invitation by token
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select(`
          *,
          roles (
            name
          ),
          organizations (
            name
          )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (invitationError || !invitation) {
        return { data: null, error: 'Invalid or expired invitation' }
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        return { data: null, error: 'Invitation has expired' }
      }

      // Check if email matches invitation
      if (invitation.email !== userData.email) {
        return { data: null, error: 'Email does not match invitation' }
      }

      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: { name: userData.name }
        }
      })

      if (signUpError) {
        return { data: null, error: signUpError.message }
      }

      if (!signUpData.user) {
        return { data: null, error: 'Failed to create user account' }
      }

      // Create user record in our database
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: signUpData.user.id,
          email: userData.email,
          name: userData.name,
          organization_id: invitation.organization_id
        }])

      if (userError) {
        console.error('Error creating user record:', userError)
        return { data: null, error: 'Failed to create user record' }
      }

      // Assign role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: signUpData.user.id,
          role_id: invitation.role_id,
          organization_id: invitation.organization_id,
          assigned_by: invitation.invited_by
        }])

      if (roleError) {
        console.error('Error assigning role:', roleError)
        // If role assignment fails, delete the user to maintain consistency
        await supabase.auth.admin.deleteUser(signUpData.user.id)
        return { data: null, error: 'Failed to assign role to user' }
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        // Don't fail the acceptance, but log the error
      }

      return { 
        data: { 
          user: signUpData.user, 
          organization: invitation.organizations
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return { data: null, error: error as any }
    }
  }

  // Resend invitation (only admins can do this)
  static async resendInvitation(invitationId: string) {
    try {
      const currentUser = await this.getCurrentUser()
      if (!currentUser) {
        return { error: 'Authentication required' }
      }

      // Check if current user is admin
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        return { error: 'Insufficient permissions. Only admins can resend invitations.' }
      }

      // Get current invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (fetchError || !invitation) {
        return { error: 'Invitation not found' }
      }

      // Generate new token and extend expiration
      const newToken = crypto.randomUUID()
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 7)

      // Update invitation
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          token: newToken,
          expires_at: newExpiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        return { error: updateError.message }
      }

      return { data: { token: newToken, expires_at: newExpiresAt }, error: null }
    } catch (error) {
      console.error('Error resending invitation:', error)
      return { error: error as any }
    }
  }
} 