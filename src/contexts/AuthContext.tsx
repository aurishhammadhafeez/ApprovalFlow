import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupabaseService } from '@/lib/supabase-service';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  organization_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        const currentUser = await SupabaseService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email!,
            name: currentUser.user_metadata?.name,
            role: 'admin'
          });
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name,
            role: 'admin'
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await SupabaseService.signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name,
          role: 'admin'
        });
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in to ApprovalFlow"
        });
        
        return { success: true };
      }
      
      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await SupabaseService.signUp(email, password, name);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: name,
          role: 'admin'
        });
        
        toast({
          title: "Account created!",
          description: "Welcome to ApprovalFlow"
        });
        
        return { success: true };
      }
      
      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await SupabaseService.signOut();
      setUser(null);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out"
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await SupabaseService.getCurrentUser();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email!,
          name: currentUser.user_metadata?.name,
          role: 'admin'
        });
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 