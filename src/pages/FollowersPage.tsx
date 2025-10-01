
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

export default function FollowersPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (userId) {
      fetchFollowers();
      fetchUserName();
    }
  }, [userId]);

  const fetchUserName = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('first_name, last_name, username')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        const displayName = data.first_name && data.last_name 
          ? `${data.first_name} ${data.last_name}`
          : data.username || 'Unknown User';
        setUserName(displayName);
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  const fetchFollowers = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:users!follower_id(id, username, first_name, last_name, profile_image_url)
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFollowers(data || []);
      
    } catch (error) {
      console.error('Error fetching followers:', error);
      toast({
        title: "Error",
        description: "Failed to load followers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUsername = (user: any) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getInitials = (user: any) => {
    if (!user) return 'UU';
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || 'UU';
  };

  if (loading) {
    return (
      <div className="container px-4 py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">
            {userName}'s Followers
          </h1>
          <p className="text-sm text-muted-foreground">
            {followers.length} followers
          </p>
        </div>
      </div>

      {/* Followers List */}
      <div className="space-y-4">
        {followers.length > 0 ? (
          followers.map(follow => (
            <div 
              key={follow.id} 
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div 
                className="flex items-center space-x-3 cursor-pointer flex-1"
                onClick={() => navigate(`/profile/${follow.follower.id}`)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={follow.follower.profile_image_url} />
                  <AvatarFallback>{getInitials(follow.follower)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{formatUsername(follow.follower)}</div>
                  <div className="text-sm text-muted-foreground">
                    @{follow.follower.username || 'user'}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/profile/${follow.follower.id}`)}
              >
                View Profile
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No followers yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
