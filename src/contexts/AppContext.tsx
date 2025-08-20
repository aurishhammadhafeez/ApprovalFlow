'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: any | null;
  setUser: (user: any | null) => void;
  organization: any | null;
  setOrganization: (org: any | null) => void;
  workflows: any[];
  setWorkflows: (workflows: any[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [user, setUser] = useState<any | null>(null);
  const [organization, setOrganization] = useState<any | null>(null);
  const [workflows, setWorkflows] = useState<any[]>([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const value: AppContextType = {
    sidebarOpen,
    toggleSidebar,
    user,
    setUser,
    organization,
    setOrganization,
    workflows,
    setWorkflows
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};