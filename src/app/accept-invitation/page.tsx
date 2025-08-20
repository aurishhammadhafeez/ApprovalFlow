'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/sonner'
import { SupabaseService } from '@/lib/supabase-service'

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [invitationAccepted, setInvitationAccepted] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (token) {
      fetchInvitation()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchInvitation = async () => {
    try {
      const { data, error } = await SupabaseService.getInvitationByToken(token!)
      
      if (error) {
        toast.error('Invalid or expired invitation')
        setLoading(false)
        return
      }

      if (data.status === 'accepted') {
        toast.error('This invitation has already been accepted')
        setLoading(false)
        return
      }

      if (data.status === 'expired') {
        toast.error('This invitation has expired')
        setLoading(false)
        return
      }

      setInvitation(data)
    } catch (error) {
      console.error('Error fetching invitation:', error)
      toast.error('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setAccepting(true)
      const { data, error } = await SupabaseService.acceptInvitation(token!, {
        email: invitation.email,
        name: formData.name.trim(),
        password: formData.password
      })

      if (error) {
        toast.error(error)
        return
      }

      // Show success message and email verification instructions
      setInvitationAccepted(true)
      setUserEmail(invitation.email)
      toast.success('Account created successfully! Please check your email to verify your account.')
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (invitationAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Account Created Successfully!</CardTitle>
            <CardDescription>
              Welcome to ApprovalFlow! Your account has been created and you're now part of the organization.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Email Verification Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Email Verification Required</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    We've sent a verification email to <strong>{userEmail}</strong>. 
                    Please check your inbox and click the verification link to activate your account.
                  </p>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <p className="text-xs text-blue-600">
                      <strong>Can't find the email?</strong> Check your spam folder or wait a few minutes for delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Check your email for the verification link</li>
                <li>Click the verification link to activate your account</li>
                <li>Sign in with your email and password</li>
                <li>Access your organization's dashboard</li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/')} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Go to Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="w-full"
              >
                Open Gmail
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://outlook.live.com', '_blank')}
                className="w-full"
              >
                Open Outlook
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Already verified? <button 
                  onClick={() => router.push('/')}
                  className="text-blue-600 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation.organizations?.name || 'an organization'} on ApprovalFlow
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* What Happens Next Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <p className="text-sm text-blue-700">
                <strong>What happens next:</strong> After accepting this invitation, you'll receive a verification email. 
                Click the verification link to activate your account, then sign in to access your organization.
              </p>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Role:</span>
              <span className="font-medium">{invitation.roles?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expires:</span>
              <span className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <Button 
            onClick={handleAcceptInvitation}
            disabled={accepting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {accepting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
