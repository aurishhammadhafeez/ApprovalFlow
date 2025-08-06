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

  // Check if user has an organization when they're authenticated
  useEffect(() => {
    const checkUserOrganization = async () => {
      if (user && !organization) {
        try {
          // Check if user already has an organization
          const { data: userData } = await SupabaseService.getUsers(user.id);
          if (userData && userData.length > 0) {
            // User already has an organization, go to dashboard
            const { data: orgData } = await SupabaseService.getOrganization(userData[0].organization_id);
            if (orgData) {
              setOrganization({
                ...orgData,
                adminName: userData[0].name,
                adminEmail: userData[0].email,
                adminRole: userData[0].role
              });
              setCurrentView('dashboard');
            }
          } else {
            // New user, go to organization setup
            setCurrentView('setup');
          }
        } catch (error) {
          console.error('Error checking user organization:', error);
          // If error, assume new user and go to setup
          setCurrentView('setup');
        }
      }
    };

    if (!loading) {
      checkUserOrganization();
    }
  }, [user, loading, organization]);

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('setup');
    } else {
      setShowSignIn(true);
    }
  };

  const handleSignIn = (userData: any) => {
    // The AuthContext will handle the actual authentication
    // This just closes the modal and lets the useEffect handle the flow
    setShowSignIn(false);
  };

  const handleOrganizationComplete = (orgData: any) => {
    setOrganization(orgData);
    setCurrentView('dashboard');
  };

  const handleCancelSetup = () => {
    setCurrentView('landing');
  };

  const handleCreateWorkflow = () => {
    setCurrentView('workflow');
  };

  const handleWorkflowSave = (workflow: any) => {
    setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await signOut();
    setOrganization(null);
    setWorkflows([]);
    setCurrentView('landing');
  };

  // Show loading while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ApprovalFlow...</p>
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
