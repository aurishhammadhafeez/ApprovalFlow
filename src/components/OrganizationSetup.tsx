import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import { useToast } from '@/hooks/use-toast';

interface OrganizationSetupProps {
  onComplete: (orgData: any) => void;
}

const OrganizationSetup: React.FC<OrganizationSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      // Get current user
      const currentUser = await SupabaseService.getCurrentUser();
      
      if (!currentUser) {
        setError('No authenticated user found');
        return;
      }

      // Create organization
      const { data: organization, error: orgError } = await SupabaseService.createOrganization({
        name: orgData.name,
        industry: orgData.industry,
        size: orgData.size,
        description: orgData.description,
        admin_id: currentUser.id
      });

      if (orgError) {
        setError(orgError.message);
        toast({
          title: "Organization creation failed",
          description: orgError.message,
          variant: "destructive"
        });
        return;
      }

      // Create user record
      const { error: userError } = await SupabaseService.createUser({
        email: currentUser.email!,
        name: orgData.adminName,
        role: 'admin',
        organization_id: organization.id
      });

      if (userError) {
        setError(userError.message);
        toast({
          title: "User creation failed",
          description: userError.message,
          variant: "destructive"
        });
        return;
      }

      const completeOrgData = {
        ...organization,
        adminName: orgData.adminName,
        adminEmail: orgData.adminEmail,
        adminRole: orgData.adminRole
      };

      onComplete(completeOrgData);
      
      toast({
        title: "Organization created!",
        description: "Your approval workflows are ready to be configured"
      });

    } catch (err) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-800">Organization Setup Complete</h4>
                <p className="text-green-600 text-sm mt-1">
                  Your approval workflows are ready to be configured
                </p>
              </div>

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
            <Button 
              onClick={handleNext}
              disabled={!isStepValid() || loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Setting Up...' : (step === 3 ? 'Complete Setup' : 'Next')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSetup;