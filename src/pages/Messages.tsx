
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageList } from '@/components/messaging/MessageList';
import { ChatWindow } from '@/components/messaging/ChatWindow';
import { NewMessageButton } from '@/components/messaging/NewMessageButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDevice } from '@/hooks/use-device';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { webSocketChatService } from '@/services/WebSocketChatService';
import { GroupChatCreationModal } from '@/components/messaging/GroupChatCreationModal';
import { GroupChatService } from '@/services/GroupChatService';

interface Conversation {
  id: string;
  other_user?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
  group_chat_name?: string;
  group_chat_description?: string;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
  is_group_chat?: boolean;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const directUserId = searchParams.get('user');
  const { isMobile } = useDevice();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false);
  const channelRef = React.useRef<any>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
      setupWebSocketConnection();
      
      return () => {
        // Cleanup will be handled by the WebSocket service
      };
    }
  }, [user]);

  useEffect(() => {
    if (directUserId && conversations.length > 0) {
      setSelectedConversation(directUserId);
      // Check if the directUserId corresponds to a group chat
      const isDirectIdGroupChat = searchParams.get('isGroupChat') === 'true';
      if (isDirectIdGroupChat) {
        setSelectedUser(null); // No 'otherUser' for group chats
      } else {
        fetchSelectedUser(directUserId);
      }
      if (isMobile) {
        setShowChatOnMobile(true);
      }
    }
  }, [directUserId, conversations, isMobile, searchParams]);

  const fetchSelectedUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, profile_image_url')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setSelectedUser(data);
    } catch (error) {
      console.error('Error fetching selected user:', error);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const directConversationMap = new Map<string, Conversation>();

      // 1) Direct messages
      try {
        const { data: directMessages, error: directMessageError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (!directMessageError) {
          for (const message of directMessages || []) {
            const otherUserId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
            const current = directConversationMap.get(otherUserId);
            const isNewer = !current?.last_message || new Date(message.created_at) > new Date(current.last_message.created_at);
            if (isNewer) {
              try {
                const { data: otherUserData } = await supabase
                  .from('users')
                  .select('id, username, first_name, last_name, profile_image_url')
                  .eq('id', otherUserId)
                  .single();
                if (otherUserData) {
                  directConversationMap.set(otherUserId, {
                    id: otherUserId,
                    other_user: otherUserData,
                    last_message: {
                      content: message.content,
                      created_at: message.created_at,
                      sender_id: message.sender_id
                    },
                    unread_count: 0,
                    is_group_chat: false,
                  });
                }
              } catch (e) {
                console.warn('Direct: failed to fetch other user', otherUserId, e);
              }
            }
          }
        } else {
          console.warn('Direct: failed to fetch messages', directMessageError);
        }
      } catch (e) {
        console.warn('Direct: unexpected error', e);
      }

      // 2) Group chats the user participates in
      let groupChatConversations: Conversation[] = [];
      try {
        const { data: groupChatParticipants, error: groupChatParticipantsError } = await supabase
          .from('group_chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);
        if (!groupChatParticipantsError) {
          const groupChatIds = (groupChatParticipants || []).map(p => p.chat_id);
          if (groupChatIds.length > 0) {
            const { data: groupChats, error: groupChatsError } = await supabase
              .from('group_chats')
              .select('id, name, description, created_by, created_at')
              .in('id', groupChatIds);
            if (!groupChatsError) {
              const latestMessagesByChatId: Record<string, any | undefined> = {};
              for (const chat of groupChats || []) {
                try {
                  const { data: latest } = await supabase
                    .from('messages')
                    .select('content, created_at, sender_id')
                    .eq('chat_id', chat.id)
                    .order('created_at', { ascending: false })
                    .limit(1);
                  latestMessagesByChatId[chat.id] = (latest && latest.length > 0) ? latest[0] : undefined;
                } catch (e) {
                  console.warn('Group: failed to fetch latest message for chat', chat.id, e);
                  latestMessagesByChatId[chat.id] = undefined;
                }
              }

              groupChatConversations = (groupChats || []).map(chat => {
                const lastMessage = latestMessagesByChatId[chat.id];
                return {
                  id: chat.id,
                  group_chat_name: chat.name,
                  group_chat_description: chat.description,
                  is_group_chat: true,
                  last_message: lastMessage ? {
                    content: lastMessage.content,
                    created_at: lastMessage.created_at,
                    sender_id: lastMessage.sender_id,
                  } : undefined,
                  unread_count: 0,
                };
              });
            } else {
              console.warn('Group: failed to fetch group chats', groupChatsError);
            }
          }
        } else {
          console.warn('Group: failed to fetch participants', groupChatParticipantsError);
        }
      } catch (e) {
        console.warn('Group: unexpected error', e);
      }

      // 3) Ensure directUserId is represented for deeplinked DMs
      if (directUserId && !directConversationMap.has(directUserId)) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username, first_name, last_name, profile_image_url')
            .eq('id', directUserId)
            .single();
          if (!userError && userData) {
            directConversationMap.set(directUserId, {
              id: directUserId,
              other_user: userData,
              last_message: undefined,
              unread_count: 0,
              is_group_chat: false,
            });
          }
        } catch (e) {
          console.warn('Deeplink: failed to fetch direct user', directUserId, e);
        }
      }

      const combinedConversations = [...Array.from(directConversationMap.values()), ...groupChatConversations];
      setConversations(combinedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocketConnection = () => {
    if (!user?.id) return;

    // Connect to WebSocket
    webSocketChatService.connect(user.id).catch(console.error);

    // Listen for new messages to refresh conversations
    const unsubscribe = webSocketChatService.onMessage((event) => {
      if (event.type === 'message' || event.type === 'message_sent') {
        // Refresh conversations when new message arrives
        fetchConversations();
      }
    });

    return unsubscribe;
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation?.is_group_chat) {
      setSelectedUser(null); // Clear other user data if it's a group chat
      // Group chat details will be fetched by ChatWindow itself
    } else {
      fetchSelectedUser(id);
    }
    
    // Update URL params deterministically 
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('user', id);
    // Add isGroupChat param if it's a group chat
    if (conversation?.is_group_chat) {
      newSearchParams.set('isGroupChat', 'true');
    }
    setSearchParams(newSearchParams);
    
    if (isMobile) {
      setShowChatOnMobile(true);
    }
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setSelectedConversation(null);
    setSelectedUser(null);
    
    // Clear search params and navigate
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams);
    
    // Navigate back to profile if came from profile
    if (directUserId) {
      navigate(`/profile/${user?.id}`, { replace: true });
    }
  };

  const handleCreateGroupChat = async (name: string, description: string, participantIds: string[]) => {
    if (!user?.id) return;
    try {
      await GroupChatService.createGroupChat({
        name,
        description,
        createdBy: user.id,
        participantIds,
      });
      toast({
        title: "Group Chat Creation",
        description: "Group chat created successfully.",
      });
      setIsGroupChatModalOpen(false);
      fetchConversations(); // Refresh conversations to include the new group chat
    } catch (error) {
      console.error('Error creating group chat:', error);
      toast({
        title: "Error",
        description: "Failed to create group chat. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation);
  const isSelectedConversationGroupChat = selectedConversationData?.is_group_chat || false;

  // Mobile view
  if (isMobile) {
    if (showChatOnMobile && selectedConversation) {
      return (
        <ChatWindow 
          conversationId={selectedConversation}
          currentUserId={user?.id || ''}
          otherUser={selectedUser}
          isGroupChat={isSelectedConversationGroupChat}
        />
      );
    }

    return (
      <div className="flex flex-col h-screen">
        <div className="flex items-center justify-between p-4 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsGroupChatModalOpen(true)} variant="outline" size="sm">
              New Group
            </Button>
            <NewMessageButton onNewMessage={fetchConversations} />
          </div>
        </div>
        <div className="flex-1">
          <MessageList 
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUserId={user?.id || ''}
          />
        </div>
        <GroupChatCreationModal
          isOpen={isGroupChatModalOpen}
          onClose={() => setIsGroupChatModalOpen(false)}
          onCreateGroupChat={handleCreateGroupChat}
        />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar with conversations */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-semibold">Messages</h1>
          <div className="flex gap-2">
            <Button onClick={() => setIsGroupChatModalOpen(true)} variant="outline" size="sm">
              New Group
            </Button>
            <NewMessageButton onNewMessage={fetchConversations} />
          </div>
        </div>
        <MessageList 
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          currentUserId={user?.id || ''}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        {selectedConversation ? (
          <ChatWindow 
            conversationId={selectedConversation}
            currentUserId={user?.id || ''}
            otherUser={selectedUser}
            isGroupChat={isSelectedConversationGroupChat}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
      <GroupChatCreationModal
        isOpen={isGroupChatModalOpen}
        onClose={() => setIsGroupChatModalOpen(false)}
        onCreateGroupChat={handleCreateGroupChat}
      />
    </div>
  );
}
