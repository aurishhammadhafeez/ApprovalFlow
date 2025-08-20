'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import Dashboard from '@/components/Dashboard'
import { SupabaseService } from '@/lib/supabase-service'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const { organization, setOrganization } = useAppContext()
  const [checkingUser, setCheckingUser] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkUserOrganization = async () => {
      if (user && !checkingUser) {
        setCheckingUser(true)
        try {
          const hasOrg = await SupabaseService.userHasOrganization()
          
          if (hasOrg) {
            const { data, error } = await SupabaseService.getCurrentUserWithOrganization()
            
            if (data && data.organization) {
              setOrganization({
                ...data.organization,
                adminName: data.user.name,
                adminEmail: data.user.email,
                adminRole: data.user.role
              })
            } else {
              router.push('/setup')
            }
          } else {
            router.push('/setup')
          }
        } catch (error) {
          console.error('Error checking user organization:', error)
          router.push('/setup')
        } finally {
          setCheckingUser(false)
        }
      }
    }

    if (!loading) {
      checkUserOrganization()
    }
  }, [user, loading, setOrganization, router])

  if (loading || checkingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Loading ApprovalFlow...' : 'Checking your organization...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  const handleCreateWorkflow = () => {
    router.push('/workflow')
  }

  const handleLogout = async () => {
    // Handle logout logic here
    router.push('/')
  }

  return (
    <Dashboard 
      orgData={organization}
      onCreateWorkflow={handleCreateWorkflow}
      onLogout={handleLogout}
    />
  )
}
