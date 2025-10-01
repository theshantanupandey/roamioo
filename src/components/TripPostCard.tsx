import React from 'react';
import { PostCard } from './PostCard';
import { TripJoinButton } from './TripJoinButton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share, MapPin, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  max_participants?: number;
  budget?: number;
  currency?: string;
  user_id: string;
}

interface TripPostCardProps {
  post: {
    id: string;
    content: string;
    image_urls: string[];
    location: string;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user_id: string;
    trip_id?: string;
    user: {
      id: string;
      username: string;
      first_name?: string;
      last_name?: string;
      profile_image_url?: string;
    } | null;
    has_liked?: boolean;
  };
  trip?: Trip;
  currentParticipants?: number;
  hasRequested?: boolean;
  isParticipant?: boolean;
  onLike?: (postId: string, isLiked: boolean) => void;
  onShare?: (post: any) => void;
  onProfileClick?: (userId: string) => void;
}

export const TripPostCard: React.FC<TripPostCardProps> = ({
  post,
  trip,
  currentParticipants = 0,
  hasRequested = false,
  isParticipant = false,
  onLike,
  onShare,
  onProfileClick
}) => {
  const { user } = useAuth();

  console.log('TripPostCard rendering:', {
    postId: post.id,
    tripId: post.trip_id,
    trip: trip,
    currentParticipants,
    hasRequested,
    isParticipant
  });

  if (!post.user) return null;

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

  const spotsLeft = trip ? (trip.max_participants || 0) - currentParticipants : 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onProfileClick?.(post.user_id)}
            >
              <AvatarImage src={post.user?.profile_image_url} />
              <AvatarFallback>{getInitials(post.user)}</AvatarFallback>
            </Avatar>
            <div>
              <div 
                className="font-medium cursor-pointer hover:underline"
                onClick={() => onProfileClick?.(post.user_id)}
              >
                {formatUsername(post.user)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.location && (
                  <>
                    <span className="mx-1">•</span>
                    <MapPin className="h-3 w-3 mr-1" />
                    {post.location}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-sm">{post.content}</p>
        </div>
      </div>

      {post.image_urls && post.image_urls.length > 0 && (
        <div className="relative aspect-video">
          <img 
            src={post.image_urls[0]} 
            alt="Post"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Trip Details Section */}
      {trip && (
        <div className="p-4 bg-muted/30 border-t">
          <h3 className="font-semibold text-lg mb-2">{trip.title}</h3>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {trip.destination}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {spotsLeft > 0 ? `${spotsLeft} spots available` : 'Trip full'}
            </div>
            {trip.budget && (
              <div className="flex items-center">
                <span className="text-lg mr-1">💰</span>
                {trip.currency || 'USD'} {trip.budget}
              </div>
            )}
          </div>
          
          {/* Join Trip Button */}
          <div className="mt-4">
            <TripJoinButton
              tripId={trip.id}
              spotsAvailable={spotsLeft}
              isOwner={user?.id === trip.user_id}
              hasRequested={hasRequested}
              isParticipant={isParticipant}
            />
          </div>
        </div>
      )}

      {/* If no trip data but post has trip_id, show placeholder */}
      {!trip && post.trip_id && (
        <div className="p-4 bg-muted/30 border-t">
          <p className="text-sm text-muted-foreground">Trip details loading...</p>
        </div>
      )}

      {/* Actions */}
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex items-center gap-1 ${post.has_liked ? 'text-red-500' : ''}`}
            onClick={() => onLike?.(post.id, !!post.has_liked)}
          >
            <Heart className={`h-5 w-5 ${post.has_liked ? 'fill-current' : ''}`} />
            <span>{Math.max(0, post.likes_count)}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-5 w-5" />
            <span>{Math.max(0, post.comments_count || 0)}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => onShare?.(post)}
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
