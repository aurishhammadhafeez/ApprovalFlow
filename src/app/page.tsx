'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from '../contexts/AppContext'
import LandingPage from '../components/LandingPage'
import SignInModal from '../components/SignInModal'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user, loading } = useAuth()
  const { setOrganization } = useAppContext()
  const [showSignIn, setShowSignIn] = useState(false)
  const router = useRouter()

  // Check if user has an organization when they're authenticated
  useEffect(() => {
    const checkUserOrganization = async () => {
      if (user) {
        try {
          // Import SupabaseService dynamically to avoid SSR issues
          const { SupabaseService } = await import('../lib/supabase-service')
          
          // Single optimized call to get user and organization data
          const { data, error } = await SupabaseService.getCurrentUserWithOrganization()
          
          if (data && data.organization) {
            setOrganization({
              ...data.organization,
              adminName: data.user.name,
              adminEmail: data.user.email,
              adminRole: data.user.role
            })
            router.push('/dashboard')
          } else if (data && !data.organization) {
            router.push('/setup')
          } else {
            console.error('Error fetching user data:', error)
            router.push('/setup')
          }
        } catch (error) {
          console.error('Error checking user organization:', error)
          router.push('/setup')
        }
      }
    }

    if (!loading) {
      checkUserOrganization()
    }
  }, [user, loading, setOrganization, router])

  // Show landing page immediately while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ApprovalFlow...</p>
        </div>
      </div>
    )
  }

  const handleGetStarted = () => {
    if (user) {
      router.push('/setup')
    } else {
      setShowSignIn(true)
    }
  }

  const handleSignIn = (userData: any) => {
    // Handle sign in logic here
    setShowSignIn(false)
  }

  return (
    <>
      <LandingPage 
        onGetStarted={handleGetStarted}
        onSignIn={() => setShowSignIn(true)}
      />
      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignIn={handleSignIn}
      />
    </>
  )
}
