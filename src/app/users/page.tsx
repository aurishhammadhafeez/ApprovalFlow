'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Mail, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import SharedDashboardLayout from '@/components/SharedDashboardLayout'
import { SupabaseService } from '@/lib/supabase-service'

export default function UsersPage() {
  const { user, loading } = useAuth()
  const { organization, setOrganization } = useAppContext()
  const router = useRouter()
  
  const [users, setUsers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'user'
  })
  const [inviting, setInviting] = useState(false)
  const [showAllInvitations, setShowAllInvitations] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
    if (!loading && user && !organization) {
      // Try to fetch organization data instead of immediately redirecting
      fetchOrganizationData()
    }
  }, [user, loading, organization, router])

  const fetchOrganizationData = async () => {
    try {
      console.log('🔍 Fetching organization data for user...'); // Debug log
      const { data, error } = await SupabaseService.getCurrentUserWithOrganization()
      
      if (data && data.organization) {
        // Set organization in context
        setOrganization({
          ...data.organization,
          adminName: data.user.name,
          adminEmail: data.user.email,
          adminRole: data.user.role
        })
        console.log('✅ Organization data fetched and set'); // Debug log
      } else {
        console.log('❌ No organization found, redirecting to setup'); // Debug log
        router.push('/setup')
      }
    } catch (error) {
      console.error('❌ Error fetching organization:', error);
      router.push('/setup')
    }
  }

  useEffect(() => {
    if (organization) {
      fetchUsers()
      fetchInvitations()
    }
  }, [organization])

  const fetchUsers = async () => {
    try {
      console.log('🔍 fetchUsers called for org:', organization.id); // Debug log
      setLoadingUsers(true)
      
      // Use getUsersWithRoles instead of getUsers to get role information
      const { data, error } = await SupabaseService.getUsersWithRoles(organization.id)
      
      if (error) {
        console.error('❌ Error fetching users:', error);
        toast.error('Failed to fetch users')
        return
      }
      
      console.log('✅ Fetched users with roles:', data); // Debug log
      setUsers(data || [])
    } catch (error) {
      console.error('❌ Error in fetchUsers:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      console.log('🔍 Fetching invitations for org:', organization.id);
      setLoadingInvitations(true)
      const { data, error } = await SupabaseService.getInvitations(
        organization.id, 
        showAllInvitations ? 'all' : 'pending'
      )
      
      if (error) {
        console.error('❌ Error fetching invitations:', error);
        toast.error('Failed to fetch invitations')
        return
      }
      
      console.log('✅ Fetched invitations:', data);
      setInvitations(data || [])
    } catch (error) {
      console.error('❌ Error in fetchInvitations:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoadingInvitations(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteForm.email.trim()) {
      toast.error('Email is required')
      return
    }

    try {
      setInviting(true)
      const { data, error } = await SupabaseService.createInvitation(
        {
          email: inviteForm.email.trim(),
          name: inviteForm.name.trim() || undefined,
          role: inviteForm.role
        },
        organization.id
      )

      if (error) {
        toast.error(error)
        return
      }

      toast.success('Invitation sent successfully!')
      setInviteForm({ email: '', name: '', role: 'user' })
      fetchInvitations()
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await SupabaseService.cancelInvitation(invitationId)
      if (error) {
        toast.error('Failed to cancel invitation')
        return
      }
      toast.success('Invitation cancelled')
      fetchInvitations()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const { error } = await SupabaseService.resendInvitation(invitationId)
      if (error) {
        toast.error('Failed to resend invitation')
        return
      }
      toast.success('Invitation resent successfully!')
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast.error('An unexpected error occurred')
    }
  }

  if (loading) {
    return null
  }

  if (!user || !organization) {
    return null
  }

  return (
    <SharedDashboardLayout
      orgData={organization}
      onLogout={() => router.push('/')}
      onCreateWorkflow={() => router.push('/workflow')}
      activeTab="users"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage organization users and permissions</p>
        </div>
      </div>
      
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Users</CardTitle>
              <CardDescription>Users who have joined your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Loading users...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                  <p className="text-gray-600">Start by inviting users to your organization</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => {
                    console.log('🔍 Rendering user:', user); // Debug log for each user
                    return (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name || 'No name'}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">
                          {user.user_roles?.[0]?.roles?.name || user.role || 'No role'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
              <CardDescription>Send invitations to new team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      placeholder="Full Name"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleInviteUser} 
                  disabled={inviting || !inviteForm.email.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  {inviting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Inviting...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {showAllInvitations ? 'All Invitations' : 'Pending Invitations'}
                  </CardTitle>
                  <CardDescription>
                    {showAllInvitations 
                      ? 'All invitations including accepted and expired ones' 
                      : 'Invitations that haven\'t been accepted yet'
                    }
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAllInvitations(!showAllInvitations)
                      // Fetch invitations after toggling
                      setTimeout(() => fetchInvitations(), 100)
                    }}
                  >
                    {showAllInvitations ? 'Show Pending' : 'Show All'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchInvitations}
                    disabled={loadingInvitations}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingInvitations ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInvitations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Loading invitations...</span>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                  <p className="text-gray-600">All invitations have been accepted or there are no pending invites</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <h4 className="font-medium text-gray-900">{invitation.name || invitation.email}</h4>
                          <p className="text-sm text-gray-600">{invitation.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">{invitation.roles?.name || 'No role'}</Badge>
                            <Badge 
                              variant={invitation.status === 'pending' ? 'secondary' : invitation.status === 'accepted' ? 'default' : 'destructive'}
                              className="flex items-center"
                            >
                              {invitation.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {invitation.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {invitation.status === 'expired' && <XCircle className="h-3 w-3 mr-1" />}
                              {invitation.status}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(invitation.expires_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SharedDashboardLayout>
  )
}
