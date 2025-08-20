'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Eye, Edit, Trash2 } from 'lucide-react'
import { SupabaseService } from '@/lib/supabase-service'
import { toast } from '@/components/ui/sonner'
import SharedDashboardLayout from '@/components/SharedDashboardLayout'

type Workflow = {
  id: string;
  name: string;
  department: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

export default function WorkflowsPage() {
  const { user, loading } = useAuth()
  const { organization } = useAppContext()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
    if (!loading && user && !organization) {
      router.push('/setup')
    }
  }, [user, loading, organization, router])

  const fetchWorkflows = async () => {
    try {
      setLoadingWorkflows(true)
      const { data: userData } = await SupabaseService.getCurrentUserWithOrganization()
      
      if (!userData?.organization) {
        toast.error('Organization not found')
        return
      }

      const { data, error } = await SupabaseService.getWorkflows(userData.organization.id)
      
      if (error) {
        console.error('Error fetching workflows:', error)
        toast.error('Failed to fetch workflows')
        return
      }

      setWorkflows(data || [])
    } catch (error) {
      console.error('Error fetching workflows:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoadingWorkflows(false)
    }
  }

  useEffect(() => {
    if (organization) {
      fetchWorkflows()
    }
  }, [organization])

  const handleCreateWorkflow = () => {
    router.push('/workflow')
  }

  if (loading || loadingWorkflows) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      </div>
    )
  }

  if (!user || !organization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="text-gray-600">Manage your approval workflows</p>
          </div>
          <Button onClick={handleCreateWorkflow} className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>

        {workflows.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first approval workflow</p>
                <Button onClick={handleCreateWorkflow} className="bg-gradient-to-r from-blue-600 to-purple-600">
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {workflow.department} • {workflow.type}
                        </span>
                        <span>
                          Created {new Date(workflow.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
