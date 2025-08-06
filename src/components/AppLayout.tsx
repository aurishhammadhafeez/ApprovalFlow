import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import LandingPage from './LandingPage';
import OrganizationSetup from './OrganizationSetup';
import Dashboard from './Dashboard';
import WorkflowBuilder from './WorkflowBuilder';
import SignInModal from './SignInModal';
import { SupabaseService } from '@/lib/supabase-service';

const AppLayout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { organization, setOrganization, workflows, setWorkflows } = useAppContext();
  const [currentView, setCurrentView] = useState<'landing' | 'setup' | 'dashboard' | 'workflow'>('landing');
  const [showSignIn, setShowSignIn] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [hasCheckedUser, setHasCheckedUser] = useState(false);

  // Check if user has an organization when they're authenticated
  useEffect(() => {
    const checkUserOrganization = async () => {
      console.log('AppLayout: Checking user organization', { 
        user: !!user, 
        hasCheckedUser, 
        checkingUser,
        currentView 
      });
      
      if (user && !hasCheckedUser && !checkingUser) {
        console.log('AppLayout: Starting organization check for user:', user.id);
        setCheckingUser(true);
        try {
          // Check if user already has an organization
          const hasOrg = await SupabaseService.userHasOrganization();
          console.log('AppLayout: User has organization:', hasOrg);
          
          if (hasOrg) {
            // User has organization, get the data and go to dashboard
            const { data, error } = await SupabaseService.getCurrentUserWithOrganization();
            console.log('AppLayout: Got user with organization data:', { data, error });
            
            if (data && data.organization) {
              setOrganization({
                ...data.organization,
                adminName: data.user.name,
                adminEmail: data.user.email,
                adminRole: data.user.role
              });
              setCurrentView('dashboard');
              console.log('AppLayout: Redirecting to dashboard');
            } else {
              // Error getting organization, go to setup
              setCurrentView('setup');
              console.log('AppLayout: Error getting organization, going to setup');
            }
          } else {
            // New user, go to organization setup
            setCurrentView('setup');
            console.log('AppLayout: New user, going to setup');
          }
        } catch (error) {
          console.error('AppLayout: Error checking user organization:', error);
          // If error, assume new user and go to setup
          setCurrentView('setup');
        } finally {
          setCheckingUser(false);
          setHasCheckedUser(true);
          console.log('AppLayout: Finished organization check');
        }
      }
    };

    if (!loading) {
      checkUserOrganization();
    }
  }, [user, loading, hasCheckedUser, checkingUser]);

  // Reset hasCheckedUser when user changes
  useEffect(() => {
    if (user) {
      console.log('AppLayout: User changed, resetting hasCheckedUser');
      setHasCheckedUser(false);
    }
  }, [user]);

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('setup');
    } else {
      setShowSignIn(true);
    }
  };

  const handleSignIn = (userData: { id: string; email: string; name?: string }) => {
    // The AuthContext will handle the actual authentication
    // This just closes the modal and lets the useEffect handle the flow
    setShowSignIn(false);
  };

  const handleOrganizationComplete = (orgData: { 
    id: string; 
    name: string; 
    industry?: string; 
    size?: string; 
    adminName?: string; 
    adminEmail?: string; 
    adminRole?: string 
  }) => {
    setOrganization(orgData);
    setCurrentView('dashboard');
  };

  const handleCancelSetup = () => {
    setCurrentView('landing');
  };

  const handleCreateWorkflow = () => {
    setCurrentView('workflow');
  };

  const handleWorkflowSave = (workflow: { 
    id: number; 
    name: string; 
    description?: string; 
    department?: string; 
    type?: string 
  }) => {
    setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    setOrganization(null);
    setWorkflows([]);
    setCurrentView('landing');
    setHasCheckedUser(false);
  };

  // Show loading while auth is initializing or checking user organization
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
    );
  }

  if (currentView === 'landing') {
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
    );
  }

  if (currentView === 'setup') {
    return (
      <OrganizationSetup 
        onComplete={handleOrganizationComplete}
        onCancel={handleCancelSetup}
      />
    );
  }

  if (currentView === 'workflow') {
    return (
      <WorkflowBuilder 
        onBack={() => setCurrentView('dashboard')}
        onSave={handleWorkflowSave}
      />
    );
  }

  if (currentView === 'dashboard' && organization) {
    return (
      <Dashboard 
        orgData={organization}
        onCreateWorkflow={handleCreateWorkflow}
        onLogout={handleLogout}
      />
    );
  }

  return <div>Loading...</div>;
};

export default AppLayout;
