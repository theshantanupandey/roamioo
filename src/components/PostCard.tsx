
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Users, Clock, Route } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNotificationTriggers } from '@/hooks/useNotificationTriggers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PostCardProps {
  id: string;
  type: 'trip' | 'path' | 'general';
  content: string;
  imageUrls?: string[];
  location?: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  tripData?: {
    tripId: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    maxParticipants?: number;
    currentParticipants?: number;
    budget?: number;
    currency?: string;
    isOwner?: boolean;
    hasRequested?: boolean;
    isParticipant?: boolean;
  };
  pathData?: {
    pathId: string;
    title: string;
    description: string;
    waypoints: number;
    estimatedDuration?: string;
    difficulty?: string;
    isFollowing?: boolean;
  };
}

export const PostCard: React.FC<PostCardProps> = ({
  id,
  type,
  content,
  imageUrls = [],
  location,
  createdAt,
  likesCount = 0,
  commentsCount = 0,
  isLiked = false,
  author,
  tripData,
  pathData
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);
  const [loading, setLoading] = useState(false);
  const [tripRequestSent, setTripRequestSent] = useState(tripData?.hasRequested || false);
  const [followingPath, setFollowingPath] = useState(pathData?.isFollowing || false);

  const { triggerLikeNotification, removeLikeNotification } = useNotificationTriggers();

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
        
        setLiked(false);
        setLikes(prev => prev - 1);
        
        // Remove notification
        removeLikeNotification(id);
      } else {
        await supabase
          .from('post_likes')
          .insert({
            post_id: id,
            user_id: user.id
          });
        
        setLiked(true);
        setLikes(prev => prev + 1);
        
        // Trigger notification with delay
        triggerLikeNotification(id, author.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleJoinTrip = async () => {
    if (!user || !tripData) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('trip_join_requests')
        .insert({
          trip_id: tripData.tripId,
          user_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      setTripRequestSent(true);
      toast({
        title: "Request sent!",
        description: "Your request to join this trip has been sent to the organizer."
      });
    } catch (error: any) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowPath = async () => {
    if (!user || !pathData) return;
    
    setLoading(true);
    try {
      if (followingPath) {
        await supabase
          .from('user_followed_paths')
          .delete()
          .eq('path_id', pathData.pathId)
          .eq('user_id', user.id);
        
        setFollowingPath(false);
        toast({
          title: "Path unfollowed",
          description: "Removed from your saved paths"
        });
      } else {
        await supabase
          .from('user_followed_paths')
          .insert({
            path_id: pathData.pathId,
            user_id: user.id,
            status: 'following'
          });
        
        setFollowingPath(true);
        toast({
          title: "Path followed!",
          description: "Added to your saved paths"
        });
      }
    } catch (error: any) {
      console.error('Error toggling path follow:', error);
      toast({
        title: "Error",
        description: "Failed to update path status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const spotsLeft = tripData ? (tripData.maxParticipants || 0) - (tripData.currentParticipants || 0) : 0;

  return (
    <Card className="w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{author.name}</p>
            <p className="text-xs text-muted-foreground">@{author.username}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm">{content}</p>
        {location && (
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {location}
          </div>
        )}
      </div>

      {/* Image or Video */}
      {imageUrls.length > 0 && (
        <div className="relative">
          {imageUrls[0].includes('.mp4') || imageUrls[0].includes('video') ? (
            <video 
              src={imageUrls[0]} 
              className="w-full h-64 object-cover"
              controls
              poster={imageUrls[1] || undefined}
            />
          ) : (
            <img 
              src={imageUrls[0]} 
              alt="Post" 
              className="w-full h-64 object-cover"
            />
          )}
        </div>
      )}

      {/* Trip Details */}
      {type === 'trip' && tripData && (
        <div className="p-4 bg-muted/30">
          <h3 className="font-semibold text-lg mb-2">{tripData.title}</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {tripData.destination}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {new Date(tripData.startDate).toLocaleDateString()} - {new Date(tripData.endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              {spotsLeft} spots available
            </div>
            {tripData.budget && (
              <div className="flex items-center">
                <span className="text-lg mr-1">💰</span>
                {tripData.currency || 'USD'} {tripData.budget}
              </div>
            )}
          </div>
          
          {!tripData.isOwner && (
            <div className="mt-4">
              {tripData.isParticipant ? (
                <Button variant="outline" disabled className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Joined
                </Button>
              ) : tripRequestSent ? (
                <Button variant="outline" disabled className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Request Sent
                </Button>
              ) : spotsLeft <= 0 ? (
                <Button variant="outline" disabled className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Trip Full
                </Button>
              ) : (
                <Button 
                  onClick={handleJoinTrip}
                  disabled={loading}
                  className="w-full bg-[#e2fa3e] hover:bg-[#d5ec35] text-black"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Join Trip"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Path Details */}
      {type === 'path' && pathData && (
        <div className="p-4 bg-muted/30">
          <h3 className="font-semibold text-lg mb-2">{pathData.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{pathData.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {pathData.waypoints} stops
            </div>
            {pathData.estimatedDuration && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {pathData.estimatedDuration}
              </div>
            )}
            {pathData.difficulty && (
              <Badge variant="outline" className="text-xs">
                {pathData.difficulty}
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={handleFollowPath}
            disabled={loading}
            className={`w-full ${followingPath 
              ? 'bg-muted hover:bg-muted/80 text-foreground' 
              : 'bg-[#e2fa3e] hover:bg-[#d5ec35] text-black'
            }`}
            variant={followingPath ? "outline" : "default"}
          >
            <Route className="h-4 w-4 mr-2" />
            {loading ? "..." : followingPath ? "Following" : "Follow Path"}
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-1 ${liked ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likes}</span>
          </button>
          <button className="flex items-center space-x-1 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">{commentsCount}</span>
          </button>
        </div>
        <button className="text-muted-foreground">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
};
