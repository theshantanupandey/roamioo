
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

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

interface MessageListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (id: string) => void;
  currentUserId: string;
}

const getDisplayName = (conversation: Conversation) => {
  if (conversation.is_group_chat && conversation.group_chat_name) {
    return conversation.group_chat_name;
  } else if (conversation.other_user) {
    const { first_name, last_name, username } = conversation.other_user;
    if (first_name || last_name) {
      return `${first_name || ''} ${last_name || ''}`.trim();
    }
    return username;
  }
  return 'Unknown User';
};

const getAvatarContent = (conversation: Conversation) => {
  if (conversation.is_group_chat) {
    return <User className="h-5 w-5" />;
  } else if (conversation.other_user?.profile_image_url) {
    return <AvatarImage src={conversation.other_user.profile_image_url} alt={conversation.other_user.username} />;
  }
  return <AvatarFallback>{getDisplayName(conversation)[0]?.toUpperCase()}</AvatarFallback>;
};

export function MessageList({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUserId,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">No conversations yet.</p>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={cn(
              "flex items-center p-4 border-b border-border cursor-pointer hover:bg-muted",
              selectedConversation === conversation.id && "bg-muted"
            )}
            onClick={() => onSelectConversation(conversation.id)}
          >
            <Avatar className="h-10 w-10 mr-3">
              {getAvatarContent(conversation)}
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-sm">{getDisplayName(conversation)}</p>
              {conversation.last_message && (
                <p className="text-xs text-muted-foreground truncate">
                  {conversation.last_message.sender_id === currentUserId ? "You: " : ""}
                  {conversation.last_message.content}
                </p>
              )}
            </div>
            {conversation.last_message && (
              <p className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
              </p>
            )}
            {conversation.unread_count > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {conversation.unread_count}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
