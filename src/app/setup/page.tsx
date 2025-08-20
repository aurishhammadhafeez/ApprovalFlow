'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import OrganizationSetup from '@/components/OrganizationSetup'

export default function SetupPage() {
  const { user, loading } = useAuth()
  const { setOrganization } = useAppContext()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

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

  const handleOrganizationComplete = (orgData: { 
    id: string; 
    name: string; 
    industry?: string; 
    size?: string; 
    adminName?: string; 
    adminEmail?: string; 
    adminRole?: string 
  }) => {
    setOrganization(orgData)
    router.push('/dashboard')
  }

  const handleCancelSetup = () => {
    router.push('/')
  }

  return (
    <OrganizationSetup 
      onComplete={handleOrganizationComplete}
      onCancel={handleCancelSetup}
    />
  )
}
