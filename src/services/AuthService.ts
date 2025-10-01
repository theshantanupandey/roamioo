import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  location: string;
  isProfileComplete: boolean;
}

// Mock storage for demo purposes
const mockStorage = {
  profiles: [] as UserProfile[],
};

export const AuthService = {
  // Register a new user
  register: async (email: string, password: string): Promise<{ user: any, session: any, error?: any }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      return { user: null, session: null, error };
    }
    
    // Create an initial profile in our mock storage
    if (data.user) {
      const profile: UserProfile = {
        id: data.user.id,
        username: '',
        first_name: '',
        last_name: '',
        fullName: '',
        avatarUrl: '',
        bio: '',
        location: '',
        isProfileComplete: false
      };
      
      mockStorage.profiles.push(profile);
    }
    
    return { 
      user: data.user, 
      session: data.session 
    };
  },
  
  // Log in an existing user
  login: async (email: string, password: string, rememberMe = false): Promise<{ user: any, session: any, error?: any }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        // For rememberMe: true, use default session length (longer)
        // For rememberMe: false, we'll need a different approach since expiresIn is not an option
      }
    });
    
    if (error) {
      return { user: null, session: null, error };
    }
    
    // If rememberMe is false, we need to handle shorter session differently
    // Since we can't use expiresIn directly, we'll need to adjust our approach
    if (!rememberMe) {
      // We'll set a flag in localStorage to check session expiry manually
      localStorage.setItem('session_type', 'temporary');
      // Store the expiry time (1 hour from now)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);
      localStorage.setItem('session_expiry', expiryTime.toISOString());
    } else {
      // For remember me, we'll use the default longer session
      localStorage.setItem('session_type', 'persistent');
      localStorage.removeItem('session_expiry');
    }
    
    return { 
      user: data.user, 
      session: data.session 
    };
  },
  
  // Log out the current user
  logout: async (): Promise<{ error?: any }> => {
    // Clear our custom session settings
    localStorage.removeItem('session_type');
    localStorage.removeItem('session_expiry');
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  
  // Update a user's profile
  updateProfile: async (userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> => {
    // Attempt to update profile in Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      // If first_name is being updated, also update user metadata
      if (profileData.first_name) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { 
            first_name: profileData.first_name,
            ...profileData.last_name && { last_name: profileData.last_name }
          }
        });
        
        if (metadataError) {
          console.error('Error updating user metadata:', metadataError);
        }
      }
      
      return data as any;
    } catch (err) {
      // Fallback to mock storage if Supabase update fails
      const profileIndex = mockStorage.profiles.findIndex(p => p.id === userId);
      
      if (profileIndex >= 0) {
        mockStorage.profiles[profileIndex] = {
          ...mockStorage.profiles[profileIndex],
          ...profileData,
          isProfileComplete: true
        };
        return mockStorage.profiles[profileIndex];
      }
      
      throw new Error('User profile not found');
    }
  },
  
  // Check if a user profile needs setup
  checkProfileSetup: async (userId: string): Promise<boolean> => {
    // Try to fetch profile from Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Check if user has username AND (first_name OR last_name)
      return !data.username || data.username.trim() === '' || (!data.first_name && !data.last_name);
    } catch (err) {
      // If no profile exists, setup is needed
      return true;
    }
  },
  
  // Check if a username is available
  checkUsernameAvailability: async (username: string): Promise<boolean> => {
    // Try to check username in Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no data returned, username is available
      return !data;
    } catch (err) {
      console.error('Error checking username availability:', err);
      // On error, assume username is not available for safety
      return false;
    }
  },
  
  // Get user profile data
  getUserProfile: async (userId: string): Promise<any> => {
    // Try to fetch profile from Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      // Fallback to mock storage
      const profile = mockStorage.profiles.find(p => p.id === userId);
      if (!profile) {
        throw new Error('User profile not found');
      }
      return profile;
    }
  },
  
  // Get current session
  getSession: async () => {
    // First, check if we have a temporary session that needs to expire
    const sessionType = localStorage.getItem('session_type');
    const sessionExpiry = localStorage.getItem('session_expiry');
    
    if (sessionType === 'temporary' && sessionExpiry) {
      const expiryTime = new Date(sessionExpiry);
      const currentTime = new Date();
      
      // If the session has expired, sign out first
      if (currentTime > expiryTime) {
        await supabase.auth.signOut();
        localStorage.removeItem('session_type');
        localStorage.removeItem('session_expiry');
        return null;
      }
    }
    
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  },
  
  // Get current user
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return data.user;
  }
};
