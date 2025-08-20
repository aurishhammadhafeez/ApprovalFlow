import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Edit, Users, UserPlus, Shield, AlertCircle, Mail, Clock, CheckCircle, X
} from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import { toast } from '@/components/ui/sonner';

interface UserManagementProps {
  orgData: any;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  created_at: string;
  user_roles?: Array<{
    roles: {
      name: string;
      description: string;
      permissions: Record<string, any>;
    };
  }>;
}

interface Invitation {
  id: string;
  email: string;
  name?: string;
  role_id: string;
  organization_id: string;
  invited_by?: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  roles?: {
    name: string;
    description: string;
  };
  users?: {
    name: string;
    email: string;
  };
}

const UserManagement: React.FC<UserManagementProps> = ({ orgData }) => {
  console.log('🚀 UserManagement component STARTED'); // Debug log
  console.log('🔍 UserManagement component rendered with orgData:', orgData); // Debug log
  
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canManageUsers, setCanManageUsers] = useState(false);
  
  console.log('🔍 Component state - users:', users, 'loading:', loading); // Debug log

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });

  const [newInvitation, setNewInvitation] = useState({
    name: '',
    email: '',
    role: ''
  });

  const roles = [
    { name: 'admin', description: 'Full access to all features and user management' },
    { name: 'manager', description: 'Can manage workflows and approve requests' },
    { name: 'user', description: 'Can create workflows and submit approvals' },
    { name: 'viewer', description: 'Read-only access to workflows' }
  ];

  const departments = ['HR', 'Finance', 'Marketing', 'IT', 'Operations', 'Sales', 'Legal'];

  // Fetch users and check current user permissions
  const fetchUsers = async () => {
    try {
      console.log('🔍 fetchUsers called - Starting...'); // Debug log
      setLoading(true);
      
      // Get current user to check permissions
      console.log('🔍 Getting current user...'); // Debug log
      const { data: userData } = await SupabaseService.getCurrentUserWithOrganization();
      console.log('🔍 Current user data:', userData); // Debug log
      
      if (!userData?.user) {
        console.log('❌ No user data found'); // Debug log
        toast.error('Authentication required');
        return;
      }
      
      setCurrentUser(userData.user);
      console.log('🔍 Current user set:', userData.user); // Debug log
      
      // Check if current user is admin
      const isAdmin = userData.user.role === 'admin';
      console.log('🔍 Is admin check:', isAdmin, 'Role:', userData.user.role); // Debug log
      setCanManageUsers(isAdmin);
      
      if (!isAdmin) {
        console.log('❌ User is not admin'); // Debug log
        toast.error('Insufficient permissions to manage users');
        return;
      }

      // Fetch users with roles
      console.log('🔍 Fetching users with roles for org:', orgData.id); // Debug log
      const { data, error } = await SupabaseService.getUsersWithRoles(orgData.id);
      
      if (error) {
        console.error('❌ Error fetching users:', error);
        toast.error('Failed to fetch users');
        return;
      }

      console.log('✅ Fetched users data:', data); // Debug log
      console.log('✅ Users array length:', data?.length); // Debug log
      setUsers(data || []);
    } catch (error) {
      console.error('❌ Error in fetchUsers:', error);
      toast.error('An unexpected error occurred');
    } finally {
      console.log('🔍 Setting loading to false'); // Debug log
      setLoading(false);
    }
  };

  // Fetch invitations
  const fetchInvitations = async () => {
    try {
      const { data, error } = await SupabaseService.getInvitations(orgData.id);
      
      if (error) {
        console.error('Error fetching invitations:', error);
        toast.error('Failed to fetch invitations');
        return;
      }

      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('An unexpected error occurred');
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered with orgData.id:', orgData.id); // Debug log
    fetchUsers();
    fetchInvitations();
  }, [orgData.id]);

  const handleAddUser = async () => {
    try {
      // Validate input
      if (!newUser.name.trim() || !newUser.email.trim() || !newUser.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Add user to organization
      const { data, error } = await SupabaseService.addUserToOrganization(
        {
          email: newUser.email.trim(),
          name: newUser.name.trim(),
          role: newUser.role
        },
        orgData.id
      );

      if (error) {
        toast.error(error);
        return;
      }

      toast.success('User added successfully!');
      
      // Reset form and close dialog
      setNewUser({ name: '', email: '', role: '', department: '' });
      setIsAddUserOpen(false);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

  const handleInviteUser = async () => {
    try {
      // Validate input
      if (!newInvitation.email.trim() || !newInvitation.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create invitation
      const { data, error } = await SupabaseService.createInvitation(
        {
          email: newInvitation.email.trim(),
          name: newInvitation.name?.trim(),
          role: newInvitation.role
        },
        orgData.id
      );

      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Invitation sent successfully!');
      
      // Reset form and close dialog
      setNewInvitation({ name: '', email: '', role: '' });
      setIsInviteUserOpen(false);
      
      // Refresh invitations list
      fetchInvitations();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await SupabaseService.cancelInvitation(invitationId);
      
      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Invitation canceled successfully!');
      
      // Refresh invitations list
      fetchInvitations();
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const { data, error } = await SupabaseService.resendInvitation(invitationId);
      
      if (error) {
        toast.error(error);
        return;
      }

      toast.success('Invitation resent successfully!');
      
      // Refresh invitations list
      fetchInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      if (!canManageUsers) {
        toast.error('Insufficient permissions');
        return;
      }

      const { error } = await SupabaseService.deleteUser(userId);
      
      if (error) {
        toast.error(error);
        return;
      }

      toast.success('User deleted successfully!');
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">You need admin permissions to manage users.</p>
        </div>
      </div>
    );
  }

  console.log('🔍 About to return JSX'); // Debug log
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users and permissions for {orgData.name}</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization. The user will receive an email with a secure link.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteName">Full Name (Optional)</Label>
                  <Input
                    id="inviteName"
                    placeholder="Enter full name"
                    value={newInvitation.name}
                    onChange={(e) => setNewInvitation(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address *</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="user@company.com"
                    value={newInvitation.email}
                    onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    This email must not be used by any other organization
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role *</Label>
                  <Select onValueChange={(value) => setNewInvitation(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          <div>
                            <div className="font-medium">{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</div>
                            <div className="text-xs text-gray-500">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsInviteUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Invite a new user to your organization. Each email can only be in one organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userName">Full Name *</Label>
                  <Input
                    id="userName"
                    placeholder="Enter full name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email Address *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="user@company.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">
                    This email must not be used by any other organization
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userRole">Role *</Label>
                  <Select onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          <div>
                            <div className="font-medium">{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</div>
                            <div className="text-xs text-gray-500">{role.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userDepartment">Department</Label>
                  <Select onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Add User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-50">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Admins</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => (u.user_roles?.[0]?.roles?.name || u.role) === 'admin').length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-red-50">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Managers</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => (u.user_roles?.[0]?.roles?.name || u.role) === 'manager').length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-50">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Regular Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => ['user', 'viewer'].includes(u.user_roles?.[0]?.roles?.name || u.role || '')).length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-50">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users List */}
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </CardContent>
            </Card>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                  <p className="text-gray-600 mb-4">Start building your team by adding the first user</p>
                  <Button onClick={() => setIsAddUserOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Add First User
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Organization Users</CardTitle>
                <CardDescription>Manage user access and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{user.name}</h4>
                          <Badge className={getRoleColor(user.user_roles?.[0]?.roles?.name || user.role || 'user')}>
                            {user.user_roles?.[0]?.roles?.name || user.role || 'No role'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-6">
          {/* Invitations Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{invitations.filter(i => i.status === 'pending').length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-50">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Accepted</p>
                    <p className="text-2xl font-bold text-gray-900">{invitations.filter(i => i.status === 'accepted').length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expired</p>
                    <p className="text-2xl font-bold text-gray-900">{invitations.filter(i => i.status === 'expired').length}</p>
                  </div>
                  <div className="p-3 rounded-full bg-red-50">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invitations List */}
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading invitations...</p>
                </div>
              </CardContent>
            </Card>
          ) : invitations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations yet</h3>
                  <p className="text-gray-600 mb-4">Start inviting users to join your organization</p>
                  <Button onClick={() => setIsInviteUserOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Send First Invitation
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Manage user invitations and track their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium">{invitation.name || invitation.email}</h4>
                          <Badge className={getRoleColor(invitation.roles?.name || 'user')}>
                            {invitation.roles?.name || 'user'}
                          </Badge>
                          <Badge className={getStatusColor(invitation.status)}>
                            {invitation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{invitation.email}</p>
                        <p className="text-xs text-gray-500">
                          Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                          Expires {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleCancelInvitation(invitation.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;