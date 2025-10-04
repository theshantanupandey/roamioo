import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageSquare, Share, MapPin, Calendar, Users, BookOpen, Route, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TripJoinButton } from './TripJoinButton';
import { PathFollowButton } from './PathFollowButton';
import { PostActions } from './PostActions';
import { TripPathDisplay } from './TripPathDisplay';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
}

interface Post {
  id: string;
  content: string;
  image_urls: string[];
  location: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user_id: string;
  trip_id?: string;
  journal_entry_id?: string;
  video_url?: string;
  user: User | null;
  has_liked?: boolean;
}

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
  path_id?: string;
}

interface PathWaypoint {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  estimated_time?: string;
  latitude?: number;
  longitude?: number;
}

interface Path {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  estimated_duration?: string;
  waypoints?: PathWaypoint[];
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  location?: string;
  mood?: string;
  image_urls?: string[];
}

interface UnifiedPostCardProps {
  post: Post;
  trip?: Trip;
  path?: Path;
  journalEntry?: JournalEntry;
  currentParticipants?: number;
  hasRequested?: boolean;
  isParticipant?: boolean;
  isFollowingPath?: boolean;
  onLike?: (postId: string, isLiked: boolean) => void;
  onShare?: (post: any) => void;
  onProfileClick?: (userId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

export const UnifiedPostCard: React.FC<UnifiedPostCardProps> = ({
  post,
  trip: tripProp,
  path,
  journalEntry,
  currentParticipants = 0,
  hasRequested = false,
  isParticipant = false,
  isFollowingPath = false,
  onLike,
  onShare,
  onProfileClick,
  onPostDeleted,
  onComment
}) => {
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | undefined>(tripProp);
  const [loadingTrip, setLoadingTrip] = useState(false);
  const [tripPath, setTripPath] = useState<any>(null);
  const [loadingPath, setLoadingPath] = useState(false);
  // --- Fetch trip info if missing but post.trip_id exists (for feed posts) ---
  useEffect(() => {
    async function fetchTrip() {
      if (!tripProp && post.trip_id) {
        setLoadingTrip(true);
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', post.trip_id)
          .maybeSingle();
        if (!error && data) {
          setTrip(data);
          
          // Fetch path if trip has one
          if (data.path_id) {
            setLoadingPath(true);
            const { data: pathData, error: pathError } = await supabase
              .from('travel_paths')
              .select(`
                *,
                path_waypoints (
                  id, title, description, order_index, estimated_time,
                  latitude, longitude
                )
              `)
              .eq('id', data.path_id)
              .maybeSingle();
            
            if (!pathError && pathData) {
              // Transform waypoints for TripPathDisplay
              const waypoints = pathData.path_waypoints?.map((wp: any, index: number) => ({
                id: wp.id,
                type: 'attraction', // Default type
                name: wp.title || 'Stop',
                location: '',
                description: wp.description || '',
                day: Math.ceil((index + 1) / 3), // Rough estimation
                estimated_time: wp.estimated_time,
                latitude: wp.latitude,
                longitude: wp.longitude
              })) || [];
              
              setTripPath({
                ...pathData,
                waypoints
              });
            }
            setLoadingPath(false);
          }
        }
        setLoadingTrip(false);
      }
    }
    fetchTrip();
    // eslint-disable-next-line
  }, [post.trip_id, tripProp]);

  function getPostType(): 'trip' | 'journal' | 'path' | 'video' | 'normal' {
    // Path posts take priority over trip posts
    if (path) return 'path';
    if ((post.trip_id && (tripProp || trip))) return 'trip';
    if (post.journal_entry_id) return 'journal';
    if (post.video_url) return 'video';
    return 'normal';
  }

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

  const postType = getPostType();
  const effectiveTrip = tripProp || trip;
  const spotsLeft = effectiveTrip ? (effectiveTrip.max_participants || 0) - currentParticipants : 0;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
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
          
          {/* Post Type Badge and Actions */}
          <div className="flex items-center gap-2">
            {/* Always show the badge for trip posts when trip info present */}
            {post.trip_id && effectiveTrip && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 p-1">
                <Users className="h-3 w-3" />
              </Badge>
            )}
            {postType === 'journal' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 p-1">
                <BookOpen className="h-3 w-3" />
              </Badge>
            )}
            {postType === 'path' && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 p-1">
                <Route className="h-3 w-3" />
              </Badge>
            )}
            {postType === 'video' && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 p-1">
                <Play className="h-3 w-3" />
              </Badge>
            )}
            <PostActions
              postId={post.id}
              postUserId={post.user_id}
              imageUrls={post.image_urls}
              onPostDeleted={onPostDeleted || (() => {})}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-3">
          {/* Journal Title for Journal Posts */}
          {postType === 'journal' && journalEntry?.title && (
            <h2 className="text-lg font-bold mb-2">{journalEntry.title}</h2>
          )}
          <p className="text-sm">{post.content}</p>
        </div>
      </div>

      {/* VIDEO */}
      {postType === 'video' && post.video_url && (
        <AspectRatio ratio={16 / 9}>
          <video 
            src={post.video_url} 
            className="w-full h-full object-contain bg-black"
            controls
            playsInline
          />
        </AspectRatio>
      )}

      {/* IMAGE - Don't show for path posts */}
      {postType !== 'video' && postType !== 'path' && post.image_urls && post.image_urls.length > 0 && (
        <AspectRatio ratio={4 / 3}>
          <img 
            src={post.image_urls[0]} 
            alt="Post"
            className="w-full h-full object-contain bg-gray-50"
          />
        </AspectRatio>
      )}

      {/* Trip Details Section (always show for all trip posts when trip is loaded and not loading) */}
      {post.trip_id && effectiveTrip && !loadingTrip && (
        <div className="p-4 bg-muted/30 border-t rounded-b-md">
          <div className="mb-2">
            <div className="font-semibold text-base mb-0.5">{effectiveTrip.title}</div>
            <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-3 mb-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>
                  {new Date(effectiveTrip.start_date).toLocaleDateString()}{" "}
                  - {new Date(effectiveTrip.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>
                  {spotsLeft > 0
                    ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'}`
                    : 'Trip full'}
                </span>
              </div>
              {effectiveTrip.budget && (
                <div className="flex items-center">
                  <span className="text-lg mr-1">💰</span>
                  <span>
                    {effectiveTrip.currency || 'USD'}&nbsp;{effectiveTrip.budget}
                  </span>
                </div>
              )}
            </div>
            <TripJoinButton
              tripId={effectiveTrip.id}
              spotsAvailable={spotsLeft}
              isOwner={user?.id === effectiveTrip.user_id}
              hasRequested={hasRequested}
              isParticipant={isParticipant}
            />
          </div>
          
          {/* Trip Path Display */}
          {effectiveTrip.path_id && tripPath && !loadingPath && (
            <TripPathDisplay
              trip={effectiveTrip}
              path={tripPath}
              onViewPath={() => {
                // Navigate to path details
                console.log('View path:', tripPath.id);
              }}
              onFollowPath={() => {
                // Follow the path
                console.log('Follow path:', tripPath.id);
              }}
            />
          )}
        </div>
      )}
      {/* Loading trip block placeholder (e.g. if trip fetch is in progress) */}
      {post.trip_id && !effectiveTrip && loadingTrip && (
        <div className="p-4 bg-muted/30 border-t">
          <p className="text-sm text-muted-foreground">Trip details loading...</p>
        </div>
      )}

      {/* Path Details with Waypoints */}
      {postType === 'path' && path && (
        <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-950/20 dark:to-indigo-950/20 border-t">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{path.title}</h3>
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                <Route className="h-3 w-3 mr-1" />
                Travel Path
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">{path.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
              {path.estimated_duration && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="font-medium">{path.estimated_duration}</span>
                </div>
              )}
              {path.difficulty_level && (
                <Badge variant="secondary" className="text-xs">
                  {path.difficulty_level}
                </Badge>
              )}
              {path.waypoints && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="font-medium">{path.waypoints.length} stops</span>
                </div>
              )}
            </div>

            {/* Waypoints Display */}
            {path.waypoints && path.waypoints.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Journey Stops</h4>
                <div className="relative pl-6 space-y-4">
                  {/* Vertical line */}
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-400 to-indigo-400" />
                  
                  {path.waypoints.map((waypoint, index) => (
                    <div key={waypoint.id} className="relative">
                      {/* Stop marker */}
                      <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-purple-500 shadow-sm z-10" />
                      
                      <div className="bg-white/60 dark:bg-gray-900/60 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                Stop {index + 1}
                              </span>
                              <h5 className="font-semibold text-sm">{waypoint.title}</h5>
                            </div>
                            {waypoint.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {waypoint.description}
                              </p>
                            )}
                          </div>
                          {waypoint.estimated_time && (
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {waypoint.estimated_time}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <PathFollowButton
              pathId={path.id}
              isFollowing={isFollowingPath}
            />
          </div>
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
            onClick={() => onComment?.(post.id)}
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
