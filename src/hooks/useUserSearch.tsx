import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

export const useUserSearch = (initialQuery = '') => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !user) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, first_name, last_name, profile_image_url')
          .neq('id', user.id)
          .or(`username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Search error",
          description: "Failed to search users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user, toast]);

  return { searchQuery, setSearchQuery, searchResults, loading };
};
