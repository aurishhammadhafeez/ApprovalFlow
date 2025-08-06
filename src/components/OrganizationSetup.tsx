import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Settings, CheckCircle, AlertCircle, X, Mail, RefreshCw } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface OrganizationSetupProps {
  onComplete: (orgData: { 
    id: string; 
    name: string; 
    industry?: string; 
    size?: string; 
    adminName?: string; 
    adminEmail?: string; 
    adminRole?: string 
  }) => void;
  onCancel: () => void;
}

const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orgData, setOrgData] = useState({
    name: '',
    industry: '',
    size: '',
    description: '',
    adminName: '',
    adminEmail: '',
    adminRole: ''
  });

  // Check email confirmation status
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      if (!user) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setEmailConfirmed(currentUser.email_confirmed_at !== null);
        }
      } catch (error) {
        console.error('Error checking email confirmation:', error);
      } finally {
        setCheckingEmail(false);
      }
    };

    checkEmailConfirmation();
  }, [user]);

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Confirmation email sent",
          description: "Please check your email and click the confirmation link"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend confirmation email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshEmailStatus = async () => {
    setCheckingEmail(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setEmailConfirmed(currentUser.email_confirmed_at !== null);
        if (currentUser.email_confirmed_at !== null) {
          toast({
            title: "Email confirmed!",
            description: "You can now proceed with organization setup"
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing email status:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education', 
    'Government', 'Non-profit', 'Real Estate', 'Consulting', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-1000 employees', '1000+ employees'
  ];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Get current user from AuthContext
      if (!user) {
        setError('No authenticated user found. Please sign in first.');
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue with organization setup",
          variant: "destructive"
        });
        return;
      }

      // Check email confirmation again before proceeding
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.email_confirmed_at) {
        setError('Please confirm your email address before creating an organization.');
        toast({
          title: "Email confirmation required",
          description: "Please confirm your email address to continue",
          variant: "destructive"
        });
        return;
      }

      console.log('Creating organization with data:', {
        name: orgData.name,
        industry: orgData.industry,
        size: orgData.size,
        admin_id: user.id
      });

      // Create organization
      const { data: organization, error: orgError } = await SupabaseService.createOrganization({
        name: orgData.name,
        industry: orgData.industry,
        size: orgData.size,
        admin_id: user.id
      });

      if (orgError) {
        console.error('Organization creation error:', orgError);
        setError(orgError.message);
        toast({
          title: "Organization creation failed",
          description: orgError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('Organization created successfully:', organization);

      // Create user record in our users table
      const { error: userError } = await SupabaseService.createUser({
        email: user.email!,
        name: orgData.adminName,
        role: 'admin',
        organization_id: organization.id
      });

      if (userError) {
        console.error('User creation error:', userError);
        setError(userError.message);
        toast({
          title: "User creation failed",
          description: userError.message,
          variant: "destructive"
        });
        return;
      }

      console.log('User record updated successfully');

      const completeOrgData = {
        ...organization,
        adminName: orgData.adminName,
        adminEmail: orgData.adminEmail,
        adminRole: orgData.adminRole
      };

      // Only call onComplete if everything succeeded
      onComplete(completeOrgData);
      
      toast({
        title: "Organization created!",
        description: "Your approval workflows are ready to be configured"
      });

    } catch (err) {
      console.error('Unexpected error in organization setup:', err);
      setError('An unexpected error occurred');
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setOrgData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return orgData.name && orgData.industry && orgData.size;
      case 2:
        return orgData.adminName && orgData.adminEmail && orgData.adminRole;
      case 3:
        return true;
      default:
        return false;
    }
  };

  // If no user is authenticated, show error
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ApprovalFlow
              </span>
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>Please sign in to continue with organization setup</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-600">You must be signed in to set up your organization</p>
            </div>
            <Button onClick={onCancel} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show email confirmation required screen
  if (!checkingEmail && !emailConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ApprovalFlow
              </span>
            </div>
            <CardTitle className="text-xl">Email Confirmation Required</CardTitle>
            <CardDescription>Please confirm your email address to continue</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <Mail className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="font-semibold text-yellow-800">Check Your Email</h4>
              <p className="text-yellow-600 text-sm mt-1">
                We sent a confirmation email to <strong>{user.email}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleRefreshEmailStatus}
                disabled={checkingEmail}
                className="w-full"
              >
                {checkingEmail ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    I've Confirmed My Email
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleResendConfirmation}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Resend Confirmation Email'}
              </Button>
              
              <Button 
                variant="ghost"
                onClick={onCancel}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking email status
  if (checkingEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking email confirmation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl relative">
        {/* Cancel Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ApprovalFlow
            </span>
          </div>
          <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
          <CardDescription>Let's get your approval workflows configured</CardDescription>
          
          {/* Progress Indicator */}
          <div className="flex justify-center space-x-4 mt-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > num ? <CheckCircle className="h-4 w-4" /> : num}
                </div>
                {num < 3 && <div className={`w-12 h-0.5 ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Organization Details</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  placeholder="Enter your organization name"
                  value={orgData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select onValueChange={(value) => handleInputChange('industry', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Company Size *</Label>
                <Select onValueChange={(value) => handleInputChange('size', value)} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your organization"
                  value={orgData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Admin Account</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName">Full Name *</Label>
                <Input
                  id="adminName"
                  placeholder="Enter admin full name"
                  value={orgData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Address *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@company.com"
                  value={orgData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminRole">Job Title *</Label>
                <Input
                  id="adminRole"
                  placeholder="e.g., CEO, Operations Manager"
                  value={orgData.adminRole}
                  onChange={(e) => handleInputChange('adminRole', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Settings className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Ready to Launch!</h3>
              </div>

              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-red-800">Setup Error</h4>
                  <p className="text-red-600 text-sm mt-1">
                    {error}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-800">Organization Setup Complete</h4>
                  <p className="text-green-600 text-sm mt-1">
                    Your approval workflows are ready to be configured
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Badge className="mb-2 bg-blue-100 text-blue-800">Organization</Badge>
                  <p className="font-medium">{orgData.name}</p>
                  <p className="text-sm text-gray-600">{orgData.industry}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Badge className="mb-2 bg-purple-100 text-purple-800">Admin</Badge>
                  <p className="font-medium">{orgData.adminName}</p>
                  <p className="text-sm text-gray-600">{orgData.adminRole}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)} 
              disabled={step === 1 || loading}
            >
              Previous
            </Button>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!isStepValid() || loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Setting Up...' : (step === 3 ? 'Complete Setup' : 'Next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSetup;