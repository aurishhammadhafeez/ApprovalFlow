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
        .select('organization_id')
        .eq('id', currentUser.id)
        .single()

      if (error || !userData || !userData.organization_id) return false

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          roles (
            name
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('organization_id', userData.organization_id)
        .eq('roles.name', 'admin')
        .maybeSingle()

      if (roleError) return false

      return !!roleData
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

      // Get user data first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (userError || !userData) return { data: null, error: userError || 'User not found' }

      // Get user role separately to avoid relationship conflicts
      let userRole = 'user'
      if (userData.organization_id) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select(`
            roles (
              name
            )
          `)
          .eq('user_id', currentUser.id)
          .eq('organization_id', userData.organization_id)
          .maybeSingle()
        
        if (!roleError && roleData?.roles) {
          userRole = (roleData.roles as any).name
        }
      }

      if (userData.organization_id) {
        const { data: orgData, error: orgError } = await this.getOrganization(userData.organization_id)
        if (orgError) return { data: null, error: orgError }

        // Create user with role information
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
      // First get all users in the organization
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
        return { data: null, error: usersError }
      }

      if (!users || users.length === 0) {
        return { data: [], error: null }
      }

      // Then get roles for each user
      const usersWithRoles = await Promise.all(
        users.map(async (user) => {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select(`
              roles (
                name,
                description,
                permissions
              )
            `)
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
            .maybeSingle()

          if (roleError) {
            console.error('Error fetching role for user:', user.id, roleError)
            return user
          }

          return {
            ...user,
            user_roles: roleData ? [roleData] : []
          }
        })
      )

      return { data: usersWithRoles, error: null }
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

      // Send invitation email using Supabase
      try {
        const { error: emailError } = await this.sendInvitationEmail(invitation, organizationId)
        if (emailError) {
          console.warn('Invitation created but email failed:', emailError)
          // Don't fail the invitation creation if email fails
        }
      } catch (emailError) {
        console.warn('Error sending invitation email:', emailError)
        // Continue even if email fails
      }

      return { data: invitation, error: null }
    } catch (error) {
      console.error('Error creating invitation:', error)
      return { data: null, error: error as any }
    }
  }

  // Get invitation by token
  static async getInvitationByToken(token: string) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          roles (
            name,
            description
          ),
          organizations (
            name
          ),
          users!invitations_invited_by_fkey (
            name,
            email
          )
        `)
        .eq('token', token)
        .single()

      if (error) {
        console.error('Error fetching invitation by token:', error)
        return { data: null, error }
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        // Update status to expired
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', data.id)
        
        data.status = 'expired'
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching invitation by token:', error)
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

      // Send new invitation email
      try {
        const { error: emailError } = await this.sendInvitationEmail(
          { ...invitation, token: newToken, expires_at: newExpiresAt.toISOString() },
          invitation.organization_id
        )
        if (emailError) {
          console.warn('Invitation updated but email failed:', emailError)
        }
      } catch (emailError) {
        console.warn('Error sending resend email:', emailError)
      }

      return { data: { token: newToken, expires_at: newExpiresAt }, error: null }
    } catch (error) {
      console.error('Error resending invitation:', error)
      return { error: error as any }
    }
  }

  // Send invitation email using Supabase
  static async sendInvitationEmail(invitation: any, organizationId: string) {
    try {
      // Get organization details for the email
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()

      if (orgError || !orgData) {
        return { error: 'Organization not found' }
      }

      // Get role details
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('name, description')
        .eq('id', invitation.role_id)
        .single()

      if (roleError || !roleData) {
        return { error: 'Role not found' }
      }

      // Get inviter details
      const { data: inviterData, error: inviterError } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', invitation.invited_by)
        .single()

      if (inviterError || !inviterData) {
        return { error: 'Inviter not found' }
      }

      // Create invitation link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://approval-flow-delta.vercel.app'
      const invitationLink = `${baseUrl}/accept-invitation?token=${invitation.token}`

      // Email content
      const emailSubject = `You're invited to join ${orgData.name} on ApprovalFlow`
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">You're invited to join ApprovalFlow!</h2>
          
          <p>Hello${invitation.name ? ` ${invitation.name}` : ''},</p>
          
          <p>You've been invited by <strong>${inviterData.name || inviterData.email}</strong> to join <strong>${orgData.name}</strong> on ApprovalFlow.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Invitation Details:</h3>
            <ul style="color: #6b7280;">
              <li><strong>Organization:</strong> ${orgData.name}</li>
              <li><strong>Role:</strong> ${roleData.name} - ${roleData.description}</li>
              <li><strong>Invited by:</strong> ${inviterData.name || inviterData.email}</li>
              <li><strong>Expires:</strong> ${new Date(invitation.expires_at).toLocaleDateString()}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This invitation link will expire in 7 days. If you have any questions, please contact ${inviterData.email}.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ApprovalFlow - AI-Powered Approval Workflow Platform
          </p>
        </div>
      `

      // For now, log the email content for manual sending
      // TODO: Integrate with email service (SendGrid, Resend, or Supabase Edge Functions)
      console.log('📧 Invitation Email Generated:')
      console.log('To:', invitation.email)
      console.log('Subject:', emailSubject)
      console.log('Invitation Link:', invitationLink)
      console.log('--- Email Content ---')
      console.log(emailBody)
      console.log('--- End Email Content ---')
      
            // Return success (email content logged for manual sending)
      return { data: { sent: true, link: invitationLink, content: emailBody }, error: null }
    } catch (error) {
      console.error('Error sending invitation email:', error)
      return { error: error as any }
    }
  }
} 