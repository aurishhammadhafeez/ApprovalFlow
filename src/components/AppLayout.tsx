import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import LandingPage from './LandingPage';
import OrganizationSetup from './OrganizationSetup';
import Dashboard from './Dashboard';
import WorkflowBuilder from './WorkflowBuilder';
import SignInModal from './SignInModal';

const AppLayout: React.FC = () => {
  const { user, setUser, organization, setOrganization, workflows, setWorkflows } = useAppContext();
  const [currentView, setCurrentView] = useState<'landing' | 'setup' | 'dashboard' | 'workflow'>('landing');
  const [showSignIn, setShowSignIn] = useState(false);

  const handleGetStarted = () => {
    setCurrentView('setup');
  };

  const handleSignIn = (userData: any) => {
    setUser(userData);
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
    setUser({ ...user, ...orgData });
    setCurrentView('dashboard');
  };

  const handleCreateWorkflow = () => {
    setCurrentView('workflow');
  };

  const handleWorkflowSave = (workflow: any) => {
    setWorkflows([...workflows, { ...workflow, id: Date.now() }]);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setOrganization(null);
    setWorkflows([]);
    setCurrentView('landing');
  };

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
      <OrganizationSetup onComplete={handleOrganizationComplete} />
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
