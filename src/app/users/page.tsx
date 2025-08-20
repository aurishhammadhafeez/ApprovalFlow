'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import SharedDashboardLayout from '@/components/SharedDashboardLayout'

export default function UsersPage() {
  const { user, loading } = useAuth()
  const { organization } = useAppContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
    if (!loading && user && !organization) {
      router.push('/setup')
    }
  }, [user, loading, organization, router])

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
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Add, remove, and manage user permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Manage your team</h3>
            <p className="text-gray-600 mb-4">Invite users and assign roles for approval workflows</p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
              Invite Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </SharedDashboardLayout>
  )
}
