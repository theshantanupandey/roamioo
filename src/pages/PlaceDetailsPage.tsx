import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Star, Phone, Globe, Clock, Users, TrendingUp, 
  ArrowLeft, Calendar, Route, Eye, ThumbsUp, Share2, 
  Heart, MessageSquare, Navigation, Camera, Plane, 
  ChevronRight, Badge as BadgeIcon, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface PlaceDetails {
  id: string;
  name: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  image_urls?: string[];
  average_rating?: number;
  total_reviews?: number;
  phone?: string;
  website?: string;
  price_range?: string;
  opening_hours?: any;
  is_verified?: boolean;
  created_at?: string;
}

interface TravelPath {
  id: string;
  title: string;
  description?: string;
  difficulty_level?: string;
  estimated_duration?: string;
  average_rating?: number;
  total_reviews?: number;
  image_url?: string;
  created_by: string;
  waypoints?: any[];
  followers_count?: number;
  is_popular?: boolean;
  creator_name?: string;
  creator_avatar?: string;
  creator_is_verified?: boolean;
}

interface PathReview {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  completion_date?: string;
  user_name: string;
  user_avatar?: string;
  created_at: string;
}

const PlaceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [travelPaths, setTravelPaths] = useState<TravelPath[]>([]);
  const [pathReviews, setPathReviews] = useState<PathReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [pathsLoading, setPathsLoading] = useState(false);
  const [selectedPath, setSelectedPath] = useState<TravelPath | null>(null);
  const [showPathPreview, setShowPathPreview] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);

  // Fetch place details
  useEffect(() => {
    if (!id) return;
    
    const fetchPlaceDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch place data
        const { data: placeData, error: placeError } = await supabase
          .from('places')
          .select('*')
          .eq('id', id)
          .single();
          
        if (placeError) {
          throw placeError;
        }
        
        setPlace(placeData);
        
        // Fetch related travel paths (simulate for demo)
        setPathsLoading(true);
        const { data: pathsData } = await supabase
          .from('travel_paths')
          .select(`
            *,
            path_reviews (
              id, rating
            )
          `)
          .eq('is_public', true)
          .order('average_rating', { ascending: false })
          .limit(3);
        
        const pathsWithMetadata = pathsData?.map(path => ({
          ...path,
          followers_count: Math.floor(Math.random() * 500) + 50,
          is_popular: path.average_rating > 4.0,
          creator_name: 'Travel Expert',
          creator_avatar: '/placeholder.svg',
          creator_is_verified: true
        })) || [];
        
        setTravelPaths(pathsWithMetadata);
        
        // Mock followers who visited
        setFollowers([
          { id: '1', name: 'Sarah Johnson', avatar: '/placeholder.svg', is_verified: true },
          { id: '2', name: 'Mike Chen', avatar: '/placeholder.svg', is_verified: false },
          { id: '3', name: 'Emma Wilson', avatar: '/placeholder.svg', is_verified: true }
        ]);
        
      } catch (error) {
        console.error('Error fetching place details:', error);
        toast({
          title: 'Error loading place',
          description: 'Could not load place details. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
        setPathsLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [id, toast]);

  const handlePlanTrip = () => {
    navigate('/trips/new', { 
      state: { 
        destination: place ? `${place.city}, ${place.country}` : '',
        placeName: place?.name 
      }
    });
  };

  const handlePathClick = (path: TravelPath) => {
    setSelectedPath(path);
    setShowPathPreview(true);
  };

  const renderPathPreview = () => {
    if (!selectedPath) return null;
    
    return (
      <Dialog open={showPathPreview} onOpenChange={setShowPathPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-[#95C11F]" />
              {selectedPath.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg relative overflow-hidden">
              <img 
                src={selectedPath.image_url || '/placeholder.svg'} 
                alt={selectedPath.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              
              {/* Mock path overlay */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="20,80 60,40 120,60 180,30 220,50"
                  stroke="#95C11F"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="5,5"
                />
                <circle cx="20" cy="80" r="4" fill="#95C11F" />
                <circle cx="60" cy="40" r="4" fill="#95C11F" />
                <circle cx="120" cy="60" r="4" fill="#95C11F" />
                <circle cx="180" cy="30" r="4" fill="#95C11F" />
                <circle cx="220" cy="50" r="4" fill="#95C11F" />
              </svg>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPath.estimated_duration || '2-3 hours'}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPath.difficulty_level || 'Easy'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{selectedPath.average_rating?.toFixed(1) || '4.5'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPath.followers_count} followers</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {selectedPath.description || 'A carefully curated travel path with multiple waypoints and hidden gems to discover.'}
            </p>
            
            <div className="flex gap-2">
              <Button className="flex-1 bg-[#95C11F] hover:bg-[#7a9e19] text-black">
                <Navigation className="h-4 w-4 mr-2" />
                Follow Path
              </Button>
              <Button variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-6 bg-muted animate-pulse rounded w-40" />
        </div>
        
        <div className="space-y-4">
          <AspectRatio ratio={16 / 9} className="bg-muted animate-pulse rounded-lg" />
          <div className="space-y-2">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Place not found</h2>
        <p className="text-muted-foreground mb-4">The place you're looking for doesn't exist.</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg line-clamp-1">{place.name}</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="line-clamp-1">
                {[place.city, place.country].filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Hero Image */}
        <div className="mt-4">
          <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
            <img 
              src={place.image_urls?.[0] || '/placeholder.svg'} 
              alt={place.name}
              className="w-full h-full object-cover"
            />
            {place.is_verified && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                <Shield className="h-4 w-4 text-[#95C11F]" />
                <span className="text-sm font-medium text-black">Verified</span>
              </div>
            )}
            {place.category && (
              <div className="absolute top-3 left-3 bg-[#95C11F]/90 backdrop-blur-sm px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-black capitalize">{place.category}</span>
              </div>
            )}
          </AspectRatio>
        </div>

        {/* Place Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{place.name}</h2>
              {place.average_rating && (
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 stroke-yellow-400" />
                    <span className="font-semibold">{place.average_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({place.total_reviews} reviews)</span>
                  </div>
                </div>
              )}
              {place.description && (
                <p className="text-muted-foreground leading-relaxed">{place.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              className="flex-1 bg-[#95C11F] hover:bg-[#7a9e19] text-black font-medium"
              onClick={handlePlanTrip}
            >
              <Plane className="h-4 w-4 mr-2" />
              Plan Trip Here
            </Button>
            <Button variant="outline" className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Add Photos
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        {(place.phone || place.website || place.address) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#95C11F]" />
                Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {place.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{place.address}</span>
                </div>
              )}
              {place.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{place.phone}</span>
                </div>
              )}
              {place.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-[#95C11F]">{place.website}</span>
                </div>
              )}
              {place.opening_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">Open 24 hours</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Social Proof */}
        {followers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-[#95C11F]" />
                People you follow visited here
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {followers.slice(0, 3).map(follower => (
                  <div key={follower.id} className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={follower.avatar} />
                        <AvatarFallback>{follower.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      {follower.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-[#95C11F] rounded-full p-1">
                          <Shield className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-center font-medium line-clamp-1">
                      {follower.name.split(' ')[0]}
                    </span>
                  </div>
                ))}
                {followers.length > 3 && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">+{followers.length - 3}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">others</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Travel Paths */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="h-5 w-5 text-[#95C11F]" />
              Travel Paths
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Curated routes to explore this destination
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {pathsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : travelPaths.length > 0 ? (
              <div className="space-y-4">
                {travelPaths.map(path => (
                  <Card 
                    key={path.id} 
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handlePathClick(path)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={path.image_url || '/placeholder.svg'} 
                            alt={path.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold line-clamp-1">{path.title}</h4>
                            {path.is_popular && (
                              <Badge className="bg-[#95C11F] text-black hover:bg-[#7a9e19]">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
                              <span>{path.average_rating?.toFixed(1) || '4.5'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{path.estimated_duration || '2-3h'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{path.followers_count}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={path.creator_avatar} />
                                <AvatarFallback>{path.creator_name?.[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                by {path.creator_name}
                              </span>
                              {path.creator_is_verified && (
                                <Shield className="h-4 w-4 text-[#95C11F]" />
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Route className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No travel paths available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#95C11F]" />
                Reviews
              </CardTitle>
              <Link to={`/place/${id}/review`}>
                <Button variant="outline" size="sm">
                  Write Review
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No reviews yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to review this place</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {renderPathPreview()}
    </div>
  );
};

export default PlaceDetailsPage;