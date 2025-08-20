'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import WorkflowBuilder from '@/components/WorkflowBuilder'

export default function WorkflowPage() {
  const { user, loading } = useAuth()
  const { organization, setOrganization } = useAppContext()
  const router = useRouter()

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
      console.log('🔍 Fetching organization data for workflow builder...'); // Debug log
      const { data, error } = await SupabaseService.getCurrentUserWithOrganization()
      
      if (data && data.organization) {
        // Set organization in context
        setOrganization({
          ...data.organization,
          adminName: data.user.name,
          adminEmail: data.user.email,
          adminRole: data.user.role
        })
        console.log('✅ Organization data fetched and set for workflow builder'); // Debug log
      } else {
        console.log('❌ No organization found, redirecting to setup'); // Debug log
        router.push('/setup')
      }
    } catch (error) {
      console.error('❌ Error fetching organization:', error);
      router.push('/setup')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!organization) {
    return null
  }

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleSave = (workflow: any) => {
    // Workflow is saved to database, redirect to dashboard
    router.push('/dashboard')
  }

  return (
    <WorkflowBuilder 
      onBack={handleBack}
      onSave={handleSave}
    />
  )
}
