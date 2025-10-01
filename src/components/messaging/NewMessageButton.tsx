
import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

interface NewMessageButtonProps {
  onNewMessage: () => void;
}

export function NewMessageButton({ onNewMessage }: NewMessageButtonProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, profile_image_url')
        .neq('id', user?.id)
        .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (targetUserId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .or(`and(sender_id.eq.${user?.id},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${user?.id})`)
        .limit(1);

      if (existingMessages && existingMessages.length > 0) {
        // Conversation exists, just navigate to it
        setOpen(false);
        onNewMessage();
        return;
      }

      // Create a placeholder message to start the conversation
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          recipient_id: targetUserId,
          content: 'Hi! 👋'
        });

      if (error) throw error;

      setOpen(false);
      onNewMessage();
      toast({
        title: "Success",
        description: "Conversation started!"
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      });
    }
  };

  const formatUsername = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'Unknown User';
  };

  const getInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.substring(0, 2).toUpperCase() || 'UU';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Search for users to start a new conversation with them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {searching ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((searchUser) => (
                  <div
                    key={searchUser.id}
                    className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                    onClick={() => startConversation(searchUser.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={searchUser.profile_image_url} />
                      <AvatarFallback className="text-xs">
                        {getInitials(searchUser)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{formatUsername(searchUser)}</p>
                      <p className="text-xs text-muted-foreground">@{searchUser.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <p className="text-center text-muted-foreground py-4 text-sm">
                No users found
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Search for users to start a conversation
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
