import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import LandingPage from './LandingPage';
import OrganizationSetup from './OrganizationSetup';
import Dashboard from './Dashboard';
import WorkflowBuilder from './WorkflowBuilder';
import SignInModal from './SignInModal';

const AppLayout: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { organization, setOrganization, workflows, setWorkflows } = useAppContext();
  const [currentView, setCurrentView] = useState<'landing' | 'setup' | 'dashboard' | 'workflow'>('landing');
  const [showSignIn, setShowSignIn] = useState(false);

  const handleGetStarted = () => {
    setCurrentView('setup');
  };

  const handleSignIn = (userData: any) => {
    if (userData.organization === 'Demo Company') {
      // Existing user with organization
      setOrganization({ name: 'Demo Company', industry: 'Technology' });
      setCurrentView('dashboard');
    } else {
      // New user needs setup
      setCurrentView('setup');
    }
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
