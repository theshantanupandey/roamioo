
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Phone, Video, Info, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { webSocketChatService, type Message as WSMessage, type ChatEvent } from '@/services/WebSocketChatService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDevice } from '@/hooks/use-device';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmojiPicker } from './EmojiPicker';

interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string; // Make recipient_id optional for group chats
  chat_id?: string; // Add chat_id for group chats
  content: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

interface GroupChatParticipant {
  id: string;
  user_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

interface GroupChatDetails {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  participants: GroupChatParticipant[];
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherUser?: {
    id: string;
    username: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
  isGroupChat?: boolean;
}

export function ChatWindow({ conversationId, currentUserId, otherUser, isGroupChat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserData, setOtherUserData] = useState<any>(otherUser);
  const [groupChatDetails, setGroupChatDetails] = useState<GroupChatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { isMobile } = useDevice();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isGroupChat) {
      fetchGroupChatDetails();
    } else if (!otherUserData || otherUserData.id !== conversationId) {
      fetchOtherUser();
    }
    fetchMessages();
    const cleanup = setupWebSocketConnection();
    
    // Monitor connection status
    const statusInterval = setInterval(() => {
      setConnectionStatus(webSocketChatService.getConnectionState());
    }, 1000);
    
    return () => {
      if (cleanup) cleanup();
      clearInterval(statusInterval);
    };
  }, [conversationId, currentUserId, isGroupChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchGroupChatDetails = async () => {
    try {
      const { data: groupChatData, error: groupChatError } = await supabase
        .from('group_chats')
        .select(`
          id, name, description, created_by,
          group_chat_participants(user_id, users(id, username, first_name, last_name, profile_image_url))
        `)
        .eq('id', conversationId)
        .single();

      if (groupChatError) throw groupChatError;
      if (!groupChatData) throw new Error("Group chat not found");

      const participants = groupChatData.group_chat_participants.map((p: any) => ({
        id: p.users.id,
        user_id: p.user_id,
        username: p.users.username,
        first_name: p.users.first_name,
        last_name: p.users.last_name,
        profile_image_url: p.users.profile_image_url,
      }));

      setGroupChatDetails({
        id: groupChatData.id,
        name: groupChatData.name,
        description: groupChatData.description,
        created_by: groupChatData.created_by,
        participants,
      });
    } catch (error) {
      console.error('Error fetching group chat details:', error);
      toast({
        title: "Error",
        description: "Failed to load group chat details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, profile_image_url')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      setOtherUserData(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      let query = supabase.from('messages').select('*');

      if (isGroupChat) {
        query = query.eq('chat_id', conversationId);
      } else {
        query = query.or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${conversationId}),and(sender_id.eq.${conversationId},recipient_id.eq.${currentUserId})`);
      }
      
      const { data: messagesData, error: messagesError } = await query.order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      const messagesWithSenders = await Promise.all(
        (messagesData || []).map(async (message) => {
          const { data: senderData } = await supabase
            .from('users')
            .select('id, username, first_name, last_name, profile_image_url')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            sender: senderData
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const setupWebSocketConnection = () => {
    if (!currentUserId) return;

    // Connect to WebSocket service
    webSocketChatService.connect(currentUserId).catch(error => {
      console.error('Failed to connect to WebSocket:', error);
    });

    // Set up message handler
    const unsubscribe = webSocketChatService.onMessage((event) => {
      console.log('WebSocket event received:', event);
      
      switch (event.type) {
        case 'message':
          // New message received
          const newMessage = event.data as Message;
          // Only add if it's for this conversation
          const isForThisDirectChat = !isGroupChat && ((newMessage.sender_id === conversationId && newMessage.recipient_id === currentUserId) ||
                                       (newMessage.sender_id === currentUserId && newMessage.recipient_id === conversationId));
          const isForThisGroupChat = isGroupChat && newMessage.chat_id === conversationId;

          if (isForThisDirectChat || isForThisGroupChat) {
            setMessages(prev => {
              const exists = prev.find(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });
            setTimeout(scrollToBottom, 100);
          }
          break;
          
        case 'message_sent':
          // Message sent confirmation
          const sentMessage = event.data as Message;
          const isSentForThisDirectChat = !isGroupChat && sentMessage.sender_id === currentUserId && sentMessage.recipient_id === conversationId;
          const isSentForThisGroupChat = isGroupChat && sentMessage.sender_id === currentUserId && sentMessage.chat_id === conversationId;

          if (isSentForThisDirectChat || isSentForThisGroupChat) {
            setMessages(prev => {
              const exists = prev.find(msg => msg.id === sentMessage.id);
              if (exists) return prev;
              return [...prev, sentMessage];
            });
            setTimeout(scrollToBottom, 100);
          }
          break;
          
        case 'typing_start':
          // Use 'id' and 'isGroupChat' from event.data
          if (event.data.id === conversationId && event.data.isGroupChat === isGroupChat) {
            setOtherUserTyping(true);
          }
          break;
          
        case 'typing_stop':
          // Use 'id' and 'isGroupChat' from event.data
          if (event.data.id === conversationId && event.data.isGroupChat === isGroupChat) {
            setOtherUserTyping(false);
          }
          break;
          
        case 'user_online':
          if (event.data.userId === conversationId) {
            setIsOtherUserOnline(true);
          }
          break;
          
        case 'user_offline':
          if (event.data.userId === conversationId) {
            setIsOtherUserOnline(false);
          }
          break;
          
        case 'connection_ack':
          console.log('WebSocket connection acknowledged');
          if (event.data?.onlineUsers && Array.isArray(event.data.onlineUsers)) {
            setIsOtherUserOnline(event.data.onlineUsers.includes(conversationId));
          }
          break;
      }
    });

    return unsubscribe;
  };


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Send message via WebSocket
      if (isGroupChat) {
        await webSocketChatService.sendGroupMessage(conversationId, newMessage.trim());
      } else {
        await webSocketChatService.sendMessage(conversationId, newMessage.trim());
      }
      
      setNewMessage('');
      setIsTyping(false);
      
      // Stop typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      webSocketChatService.sendTypingIndicator(conversationId, false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Send typing indicator
    if (value.trim()) {
      webSocketChatService.sendTypingIndicator(conversationId, true);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        webSocketChatService.sendTypingIndicator(conversationId, false);
        setTypingTimeout(null);
      }, 1000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
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

  const handleBackClick = () => {
    // On mobile, always go back to messages page and clear query params
    if (isMobile) {
      navigate('/messages', { replace: true });
    } else {
      // Check if user came from a profile (has user query param)
      const userParam = searchParams.get('user');
      if (userParam && otherUserData?.id) {
        // Navigate back to the user's profile
        navigate(`/profile/${otherUserData.id}`, { replace: true });
      } else {
        // Navigate back to messages list
        navigate('/messages', { replace: true });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chatHeaderTitle = isGroupChat ? groupChatDetails?.name : formatUsername(otherUserData);
  const chatHeaderSubtitle = isGroupChat ? 
    (groupChatDetails?.participants.length ? `${groupChatDetails.participants.length} members` : '') : 
    `@${otherUserData?.username}`;
  const chatHeaderAvatar = isGroupChat ? 
    (
      <Avatar className="h-10 w-10">
        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
      </Avatar>
    ) : (
      <Avatar className="h-10 w-10">
        <AvatarImage src={otherUserData?.profile_image_url} />
        <AvatarFallback>{getInitials(otherUserData)}</AvatarFallback>
      </Avatar>
    );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Instagram-style Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {chatHeaderAvatar}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{chatHeaderTitle}</span>
              {!isGroupChat && isOtherUserOnline && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {chatHeaderSubtitle}
              {!isGroupChat && connectionStatus === 'connecting' && 'Connecting...'}
              {!isGroupChat && connectionStatus === 'connected' && '✓ Connected'}
              {!isGroupChat && connectionStatus === 'disconnected' && 'Disconnected'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => toast({ title: "Coming Soon", description: "Voice calls will be available soon!" })}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => toast({ title: "Coming Soon", description: "Video calls will be available soon!" })}
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            {chatHeaderAvatar}
            <h3 className="text-lg font-semibold mb-1">{chatHeaderTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4">{chatHeaderSubtitle}</p>
            <p className="text-sm text-muted-foreground">Start your conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2",
                message.sender_id === currentUserId ? "justify-end" : "justify-start"
              )}
            >
              {message.sender_id !== currentUserId && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={message.sender?.profile_image_url} />
                  <AvatarFallback className="text-xs">{getInitials(message.sender)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 break-words",
                  message.sender_id === currentUserId
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}
              >
                {isGroupChat && message.sender_id !== currentUserId && message.sender?.username && (
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">
                    @{message.sender.username}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        {otherUserTyping && !isGroupChat && (
          <div className="flex items-start gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={otherUserData?.profile_image_url} />
              <AvatarFallback className="text-xs">{getInitials(otherUserData)}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl px-4 py-2 rounded-bl-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-style Message Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 md:left-80 p-3 border-t border-border bg-background/95 backdrop-blur-sm z-50">
        <form onSubmit={sendMessage} className="flex items-end gap-2 max-w-2xl mx-auto">
          <div className="flex-1 flex items-end bg-muted rounded-2xl px-3 py-2 min-h-[44px] max-h-[120px]">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            <textarea
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type a message..."
              disabled={sending}
              rows={1}
              className="flex-1 border-0 bg-transparent resize-none focus:outline-none px-2 py-1 max-h-[80px] text-sm leading-5"
              style={{
                minHeight: '24px',
                maxHeight: '80px',
                overflowY: newMessage.split('\n').length > 3 ? 'auto' : 'hidden'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            {otherUserTyping && !isGroupChat && (
              <div className="absolute -top-8 left-3 text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border">
                {formatUsername(otherUserData)} is typing...
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={sending || !newMessage.trim()} 
            size="icon"
            className="rounded-full h-11 w-11 flex-shrink-0 mb-0.5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
