import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Mail, Lock, AlertCircle } from 'lucide-react';
import { SupabaseService } from '@/lib/supabase-service';
import { useToast } from '@/hooks/use-toast';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (userData: any) => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onSignIn }) => {
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!signInData.email || !signInData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await SupabaseService.signIn(signInData.email, signInData.password);
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        const userData = {
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          email: data.user.email,
          role: 'Admin'
        };
        
        onSignIn(userData);
        onClose();
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to ApprovalFlow"
        });
      }
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

  const handleSignUp = async () => {
    if (!signUpData.name || !signUpData.email || !signUpData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await SupabaseService.signUp(signUpData.email, signUpData.password, signUpData.name);
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        const userData = {
          id: data.user.id,
          name: signUpData.name,
          email: signUpData.email,
          role: 'Admin'
        };
        
        onSignIn(userData);
        onClose();
        toast({
          title: "Account created!",
          description: "Welcome to ApprovalFlow"
        });
      }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ApprovalFlow
            </span>
          </div>
          <DialogTitle>Welcome Back</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4 mt-6">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={signInData.email}
                  onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={signInData.password}
                  onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              onClick={handleSignIn} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <Button variant="link" className="text-sm">
                Forgot your password?
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-6">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <Input
                id="signup-name"
                placeholder="Enter your full name"
                value={signUpData.name}
                onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  className="pl-10"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="Confirm your password"
                  className="pl-10"
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              onClick={handleSignUp}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-xs text-gray-600 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SignInModal;