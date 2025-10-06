import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Route, Compass, MapPin, Store, Utensils, Camera, BookOpen, Plus, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PathStop {
  id: string;
  type: 'accommodation' | 'food' | 'attraction' | 'transport' | 'shopping';
  name: string;
  location: string;
  description: string;
  image: string;
  day: number;
  rating?: number;
}

interface TravelPath {
  id: string;
  title: string;
  influencer: {
    name: string;
    username: string;
    avatar: string;
    followers: string;
  };
  destination: string;
  duration: string;
  image: string;
  description: string;
  stops: PathStop[];
  tags: string[];
  createdBy?: string; // Add this field
}

const FollowPath = () => {
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [activeDayFilter, setActiveDayFilter] = useState<number | null>(null);
  const [travelPaths, setTravelPaths] = useState<TravelPath[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTravelPaths();
  }, [user]);

  const fetchTravelPaths = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: paths, error } = await supabase
        .from('travel_paths')
        .select(`
          id,
          title,
          description,
          image_url,
          estimated_duration,
          difficulty_level,
          created_by,
          created_at,
          users!travel_paths_created_by_fkey (
            id,
            username,
            first_name,
            last_name,
            profile_image_url
          ),
          path_waypoints (
            id,
            title,
            description,
            order_index,
            estimated_time,
            latitude,
            longitude,
            image_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPaths: TravelPath[] = (paths || []).map(path => ({
        id: path.id,
        title: path.title,
        destination: path.description || '',
        duration: path.estimated_duration || '',
        image: path.image_url || '/placeholder.svg',
        description: path.description || '',
        influencer: {
          name: path.users?.first_name && path.users?.last_name 
            ? `${path.users.first_name} ${path.users.last_name}`
            : path.users?.username || 'Unknown',
          username: path.users?.username || '',
          avatar: path.users?.profile_image_url || '/placeholder.svg',
          followers: '0'
        },
        createdBy: path.created_by, // Add this for filtering
        stops: (path.path_waypoints || []).map((wp: any) => ({
          id: wp.id,
          type: 'attraction' as const,
          name: wp.title,
          location: `${wp.latitude}, ${wp.longitude}`,
          description: wp.description || '',
          image: wp.image_url || '/placeholder.svg',
          day: 1,
        })),
        tags: []
      }));

      setTravelPaths(formattedPaths);
    } catch (error) {
      console.error('Error fetching travel paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load travel paths',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPath = () => {
    return travelPaths.find(path => path.id === activePathId);
  };

  const selectedPath = getSelectedPath();

  const filteredStops = selectedPath?.stops.filter(stop => 
    activeDayFilter === null || stop.day === activeDayFilter
  );

  const uniqueDays = selectedPath?.stops.reduce((days: number[], stop) => {
    if (!days.includes(stop.day)) {
      days.push(stop.day);
    }
    return days.sort((a, b) => a - b);
  }, []);

  const handleFollow = (path: TravelPath) => {
    toast({
      title: "Path Selected!",
      description: `You're now following ${path.title}`,
    });
    setActivePathId(path.id);
  };

  const handlePlanTrip = (path?: TravelPath) => {
    navigate('/trips/new', { 
      state: { 
        destination: path?.destination || selectedPath?.destination,
        pathId: path?.id || selectedPath?.id
      } 
    });
  };

  const handleSharePath = async () => {
    if (!selectedPath || !user) {
      toast({
        title: "Error",
        description: "Please select a path and sign in to share",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: `Check out this amazing travel path: ${selectedPath.title}`,
          path_id: selectedPath.id,
          privacy_level: 'public'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Path Shared!",
        description: "Your travel path has been shared to your feed",
      });
    } catch (error) {
      console.error('Error sharing path:', error);
      toast({
        title: "Error",
        description: "Failed to share path to feed",
        variant: "destructive"
      });
    }
  };

  const getStopIcon = (type: PathStop['type']) => {
    switch (type) {
      case 'accommodation': return <MapPin className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'attraction': return <Camera className="h-4 w-4" />;
      case 'transport': return <Route className="h-4 w-4" />;
      case 'shopping': return <Store className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getStopClass = (type: PathStop['type']) => {
    switch (type) {
      case 'accommodation': return 'bg-purple-100 text-purple-800';
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'attraction': return 'bg-green-100 text-green-800';
      case 'transport': return 'bg-blue-100 text-blue-800';
      case 'shopping': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container p-5 pb-28">
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Follow The Path</h1>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Experience travel journeys curated by top influencers
        </p>

        {!selectedPath ? (
          <Tabs defaultValue="popular" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="my">My Paths</TabsTrigger>
            </TabsList>
            
            <TabsContent value="popular" className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-48 bg-muted" />
                      <CardContent className="p-4">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : travelPaths.length === 0 ? (
                <div className="text-center py-10">
                  <Route className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No travel paths yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Discover amazing travel paths shared by the community.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {travelPaths.filter(path => path.createdBy !== user?.id).map(path => (
                    <Card key={path.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleFollow(path)}>
                      <div className="relative h-48 overflow-hidden rounded-t-lg">
                        <img src={path.image} alt={path.title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <h3 className="text-white font-bold text-lg">{path.title}</h3>
                          <div className="flex items-center text-white/90 text-sm">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{path.destination}</span>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={path.influencer.avatar} />
                              <AvatarFallback>{path.influencer.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{path.influencer.name}</p>
                              <p className="text-xs text-muted-foreground">@{path.influencer.username}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{path.stops.length} stops</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="new" className="animate-fade-in">
              <div className="text-center py-10">
                <Compass className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">New paths are coming soon!</p>
              </div>
            </TabsContent>
            
            <TabsContent value="nearby" className="animate-fade-in">
              <div className="text-center py-10">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Enable location to discover nearby paths</p>
                <Button variant="outline">
                  Enable Location
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="saved" className="animate-fade-in">
              <div className="text-center py-10">
                <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Saved paths coming soon!</p>
              </div>
            </TabsContent>
            
            <TabsContent value="my" className="animate-fade-in">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-16 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate('/create-path')}>
                    <Plus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium mb-2 text-center">Create a New Path</p>
                    <p className="text-sm text-muted-foreground text-center">Share your travels with the community</p>
                  </div>
                  
                  {travelPaths.filter(path => path.createdBy === user?.id).length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Your Created Paths</h3>
                      {travelPaths
                        .filter(path => path.createdBy === user?.id)
                        .map(path => (
                          <Card key={path.id} className="mb-3 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleFollow(path)}>
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                <div className="h-16 w-16 overflow-hidden rounded-md flex-shrink-0">
                                  <img src={path.image} alt={path.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{path.title}</h4>
                                  <p className="text-sm text-muted-foreground line-clamp-1">{path.description}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span>{path.stops.length} stops</span>
                                    {path.duration && (
                                      <>
                                        <span>•</span>
                                        <span>{path.duration}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // Selected path view (would only show if a path was selected)
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setActivePathId(null)}
              >
                Back to Paths
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleSharePath}
                >
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button 
                  onClick={() => handlePlanTrip()} 
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Plan This Trip
                </Button>
              </div>
            </div>
            
            {selectedPath && (
              <>
                <div className="rounded-lg overflow-hidden relative">
                  <img 
                    src={selectedPath.image} 
                    alt={selectedPath.title} 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h2 className="text-xl font-bold text-white">{selectedPath.title}</h2>
                    <div className="flex items-center text-white/90">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{selectedPath.destination}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={selectedPath.influencer.avatar} />
                      <AvatarFallback>{selectedPath.influencer.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedPath.influencer.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPath.influencer.username}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {selectedPath.influencer.followers} followers
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">About This Path</h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedPath.description}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Path Stops</h3>
                    <div className="flex gap-1 overflow-x-auto py-1">
                      <Button 
                        variant={activeDayFilter === null ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setActiveDayFilter(null)}
                        className="text-xs"
                      >
                        All Days
                      </Button>
                      {uniqueDays?.map(day => (
                        <Button 
                          key={day}
                          variant={activeDayFilter === day ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setActiveDayFilter(day)}
                          className="text-xs"
                        >
                          Day {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredStops?.map((stop) => (
                      <div key={stop.id} className="bg-white border rounded-lg overflow-hidden">
                        <div className="aspect-[3/2] relative">
                          <img 
                            src={stop.image} 
                            alt={stop.name} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge className={`${getStopClass(stop.type)} flex items-center gap-1`}>
                              {getStopIcon(stop.type)}
                              <span className="capitalize">{stop.type}</span>
                            </Badge>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-purple-600">Day {stop.day}</Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium">{stop.name}</h4>
                          <div className="flex items-center text-sm text-muted-foreground mt-1 mb-2">
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            <span>{stop.location}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {stop.description}
                          </p>
                          {stop.rating && (
                            <div className="flex items-center">
                              <div className="flex items-center text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <svg 
                                    key={i} 
                                    className={`w-4 h-4 ${i < Math.floor(stop.rating || 0) ? 'fill-current' : 'stroke-current fill-none'}`} 
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm font-medium ml-2">{stop.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowPath;
