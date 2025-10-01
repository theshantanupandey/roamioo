
import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService } from '@/services/AuthService';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: any | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsProfileSetup: boolean;
  refreshProfileSetupStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const checkProfileSetup = async (userId: string) => {
    try {
      const needsSetup = await AuthService.checkProfileSetup(userId);
      setNeedsProfileSetup(needsSetup);
      return needsSetup;
    } catch (error) {
      console.error("Error checking profile setup:", error);
      setNeedsProfileSetup(true);
      return true;
    }
  };

  const refreshProfileSetupStatus = async () => {
    if (user) {
      await checkProfileSetup(user.id);
    }
  };

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only update state synchronously here
        setUser(session?.user ?? null);
        
        // Check if profile setup is needed for authenticated users
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            checkProfileSetup(session.user.id);
          }, 0);
        } else {
          setNeedsProfileSetup(false);
        }
        
        // If we got a signed_out event, clear our custom session data
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('session_type');
          localStorage.removeItem('session_expiry');
          setNeedsProfileSetup(false);
        }

      }
    );
    
    // Check for current session on initial load
    const checkSession = async () => {
      try {
        // Check if we have a temporary session that should expire
        const sessionType = localStorage.getItem('session_type');
        const sessionExpiry = localStorage.getItem('session_expiry');
        
        if (sessionType === 'temporary' && sessionExpiry) {
          const expiryTime = new Date(sessionExpiry);
          const currentTime = new Date();
          
          if (currentTime > expiryTime) {
            // Session expired, sign out
            await AuthService.logout();
            setUser(null);
            setNeedsProfileSetup(false);
            setIsLoading(false);
            return;
          }
        }
        
        const session = await AuthService.getSession();
        setUser(session?.user || null);
        
        // If no session but stale tokens might exist, clear them
        if (!session) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.error("Error clearing stale session:", e);
          }
        }
        
        // Check if profile setup is needed
        if (session?.user) {
          await checkProfileSetup(session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
        setNeedsProfileSetup(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    // Clean up subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      const result = await AuthService.login(email, password, rememberMe);
      setUser(result.user);
      
      // Check if profile setup is needed after login
      if (result.user) {
        await checkProfileSetup(result.user.id);
      }
      
      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const result = await AuthService.register(email, password);
      setUser(result.user);
      
      // New users always need profile setup
      setNeedsProfileSetup(true);
      
      return result;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setNeedsProfileSetup(false);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        isLoading,
        needsProfileSetup,
        refreshProfileSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
