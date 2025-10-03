import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Route, 
  MapPin, 
  Star, 
  Users, 
  Clock, 
  Wand2, 
  Plus, 
  Search,
  X,
  Utensils,
  Camera,
  Store,
  Compass,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface PathStop {
  id: string;
  type: 'accommodation' | 'food' | 'attraction' | 'transport' | 'shopping';
  name: string;
  location: string;
  description: string;
  image?: string;
  day: number;
  estimated_time?: string;
  latitude?: number;
  longitude?: number;
}

export interface TravelPath {
  id: string;
  title: string;
  description?: string;
  difficulty_level?: string;
  estimated_duration?: string;
  average_rating?: number;
  total_reviews?: number;
  image_url?: string;
  created_by: string;
  waypoints?: PathStop[];
  creator_name?: string;
  creator_avatar?: string;
}

export interface PathSelection {
  type: 'none' | 'manual' | 'ai_generated' | 'existing';
  path?: TravelPath;
  waypoints?: PathStop[];
  metadata?: any;
}

interface PathSelectorProps {
  destination: string;
  onPathSelect: (selection: PathSelection) => void;
  selectedPath?: PathSelection;
}

export const PathSelector: React.FC<PathSelectorProps> = ({
  destination,
  onPathSelect,
  selectedPath
}) => {
  const [activeTab, setActiveTab] = useState<string>('none');
  const [existingPaths, setExistingPaths] = useState<TravelPath[]>([]);
  const [loadingPaths, setLoadingPaths] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualStops, setManualStops] = useState<PathStop[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load existing paths when destination changes
  useEffect(() => {
    if (destination && activeTab === 'existing') {
      loadExistingPaths();
    }
  }, [destination, activeTab]);

  // Initialize from selected path
  useEffect(() => {
    if (selectedPath) {
      setActiveTab(selectedPath.type);
      if (selectedPath.type === 'manual' && selectedPath.waypoints) {
        setManualStops(selectedPath.waypoints);
      }
    }
  }, [selectedPath]);

  const loadExistingPaths = async () => {
    if (!destination) return;
    
    setLoadingPaths(true);
    try {
      // Search for paths that might match the destination
      const { data: pathsData, error } = await supabase
        .from('travel_paths')
        .select(`
          *,
          path_waypoints (
            id, title, description, order_index, estimated_time,
            latitude, longitude, place_id
          ),
          creator:created_by (
            id, username, first_name, last_name, profile_image_url
          )
        `)
        .eq('is_public', true)
        .ilike('title', `%${destination}%`)
        .order('average_rating', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedPaths: TravelPath[] = pathsData?.map(path => ({
        id: path.id,
        title: path.title,
        description: path.description,
        difficulty_level: path.difficulty_level,
        estimated_duration: path.estimated_duration,
        average_rating: path.average_rating,
        total_reviews: path.total_reviews,
        image_url: path.image_url,
        created_by: path.created_by,
        waypoints: path.path_waypoints?.map((wp: any) => ({
          id: wp.id,
          type: 'attraction', // Default type, could be enhanced
          name: wp.title || 'Stop',
          location: '',
          description: wp.description || '',
          day: Math.ceil(wp.order_index / 3), // Rough estimation
          estimated_time: wp.estimated_time,
          latitude: wp.latitude,
          longitude: wp.longitude
        })) || [],
        creator_name: path.creator?.first_name && path.creator?.last_name 
          ? `${path.creator.first_name} ${path.creator.last_name}`
          : path.creator?.username || 'Unknown',
        creator_avatar: path.creator?.profile_image_url
      })) || [];

      setExistingPaths(formattedPaths);
    } catch (error) {
      console.error('Error loading paths:', error);
      toast({
        title: 'Error',
        description: 'Failed to load existing paths',
        variant: 'destructive'
      });
    } finally {
      setLoadingPaths(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Auto-select based on tab
    if (value === 'none') {
      onPathSelect({ type: 'none' });
    }
  };

  const selectExistingPath = (path: TravelPath) => {
    onPathSelect({
      type: 'existing',
      path,
      waypoints: path.waypoints,
      metadata: { sourcePathId: path.id }
    });
    toast({
      title: 'Path Selected',
      description: `Selected "${path.title}" for your trip`
    });
  };

  const addManualStop = () => {
    const newStop: PathStop = {
      id: `manual-${Date.now()}`,
      type: 'attraction',
      name: '',
      location: '',
      description: '',
      day: Math.max(...manualStops.map(s => s.day), 0) + 1
    };
    setManualStops([...manualStops, newStop]);
  };

  const updateManualStop = (id: string, updates: Partial<PathStop>) => {
    setManualStops(stops => 
      stops.map(stop => 
        stop.id === id ? { ...stop, ...updates } : stop
      )
    );
  };

  const removeManualStop = (id: string) => {
    setManualStops(stops => stops.filter(stop => stop.id !== id));
  };

  const saveManualPath = () => {
    if (manualStops.length === 0) {
      toast({
        title: 'No Stops Added',
        description: 'Please add at least one stop to create a path',
        variant: 'destructive'
      });
      return;
    }

    onPathSelect({
      type: 'manual',
      waypoints: manualStops,
      metadata: { manuallyCreated: true }
    });
    
    toast({
      title: 'Manual Path Created',
      description: `Created path with ${manualStops.length} stops`
    });
  };

  const generateAIPath = async () => {
    if (!destination) {
      toast({
        title: 'Missing Destination',
        description: 'Please enter a destination first',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingAI(true);
    try {
      // Simulate AI generation for now
      // In a real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAIStops: PathStop[] = [
        {
          id: 'ai-1',
          type: 'attraction',
          name: `${destination} Central Square`,
          location: destination,
          description: 'Historic city center with beautiful architecture',
          day: 1,
          estimated_time: '2 hours'
        },
        {
          id: 'ai-2',
          type: 'food',
          name: `Traditional ${destination} Restaurant`,
          location: destination,
          description: 'Experience local cuisine',
          day: 1,
          estimated_time: '1 hour'
        },
        {
          id: 'ai-3',
          type: 'attraction',
          name: `${destination} Museum`,
          location: destination,
          description: 'Learn about local history and culture',
          day: 2,
          estimated_time: '3 hours'
        }
      ];

      onPathSelect({
        type: 'ai_generated',
        waypoints: mockAIStops,
        metadata: { 
          aiPrompt: aiPrompt || `Generate a travel path for ${destination}`,
          generatedAt: new Date().toISOString()
        }
      });

      toast({
        title: 'AI Path Generated',
        description: `Generated ${mockAIStops.length} stops for your trip`
      });
    } catch (error) {
      console.error('Error generating AI path:', error);
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate AI path. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingAI(false);
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

  const filteredPaths = existingPaths.filter(path =>
    path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    path.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-[#95C11F]" />
        <Label className="text-base font-medium">Travel Path (Optional)</Label>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="none">No Path</TabsTrigger>
          <TabsTrigger value="existing">Existing</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="ai_generated">AI Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="none" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Compass className="h-12 w-12 mx-auto mb-2" />
                <p>No specific path for this trip</p>
                <p className="text-sm">You can plan activities manually after creating the trip</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose Existing Path</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search paths..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={loadExistingPaths} disabled={loadingPaths} variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPaths ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredPaths.length > 0 ? (
                <div className="space-y-4">
                  {filteredPaths.map(path => (
                    <Card 
                      key={path.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedPath?.path?.id === path.id ? 'ring-2 ring-[#95C11F]' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectExistingPath(path)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {path.image_url && (
                            <img 
                              src={path.image_url} 
                              alt={path.title}
                              className="w-16 h-16 rounded object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{path.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {path.description}
                                </p>
                              </div>
                              {path.average_rating && (
                                <Badge variant="secondary" className="ml-2">
                                  <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  {path.average_rating.toFixed(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarImage src={path.creator_avatar} />
                                  <AvatarFallback className="text-xs">
                                    {path.creator_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{path.creator_name}</span>
                              </div>
                              {path.estimated_duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{path.estimated_duration}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{path.waypoints?.length || 0} stops</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Route className="h-12 w-12 mx-auto mb-2" />
                  <p>No paths found for "{destination}"</p>
                  <p className="text-sm">Try searching with different keywords or create a manual path</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create Manual Path</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add stops and activities for your trip
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {manualStops.map((stop, index) => (
                <Card key={stop.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="bg-[#95C11F] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      {index < manualStops.length - 1 && (
                        <div className="w-px h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <Select 
                          value={stop.type} 
                          onValueChange={(value: PathStop['type']) => 
                            updateManualStop(stop.id, { type: value })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="attraction">
                              <div className="flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Attraction
                              </div>
                            </SelectItem>
                            <SelectItem value="food">
                              <div className="flex items-center gap-2">
                                <Utensils className="h-4 w-4" />
                                Food
                              </div>
                            </SelectItem>
                            <SelectItem value="accommodation">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Stay
                              </div>
                            </SelectItem>
                            <SelectItem value="shopping">
                              <div className="flex items-center gap-2">
                                <Store className="h-4 w-4" />
                                Shopping
                              </div>
                            </SelectItem>
                            <SelectItem value="transport">
                              <div className="flex items-center gap-2">
                                <Route className="h-4 w-4" />
                                Transport
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Day"
                          type="number"
                          value={stop.day}
                          onChange={(e) => 
                            updateManualStop(stop.id, { day: parseInt(e.target.value) || 1 })
                          }
                          className="w-20"
                          min="1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeManualStop(stop.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Stop name"
                        value={stop.name}
                        onChange={(e) => 
                          updateManualStop(stop.id, { name: e.target.value })
                        }
                      />
                      <Input
                        placeholder="Location"
                        value={stop.location}
                        onChange={(e) => 
                          updateManualStop(stop.id, { location: e.target.value })
                        }
                      />
                      <Textarea
                        placeholder="Description"
                        value={stop.description}
                        onChange={(e) => 
                          updateManualStop(stop.id, { description: e.target.value })
                        }
                        rows={2}
                      />
                      <Input
                        placeholder="Estimated time (e.g., 2 hours)"
                        value={stop.estimated_time || ''}
                        onChange={(e) => 
                          updateManualStop(stop.id, { estimated_time: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="flex gap-2">
                <Button onClick={addManualStop} variant="outline" className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stop
                </Button>
                {manualStops.length > 0 && (
                  <Button onClick={saveManualPath} className="bg-[#95C11F] text-black hover:bg-[#7a9e19]">
                    Save Path
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai_generated" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Generated Path</CardTitle>
              <p className="text-sm text-muted-foreground">
                Let AI create a personalized travel path for your destination
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Additional Preferences (Optional)</Label>
                <Textarea
                  placeholder="e.g., I love historical sites, prefer vegetarian food, traveling with kids..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button 
                onClick={generateAIPath} 
                disabled={generatingAI || !destination}
                className="w-full bg-[#95C11F] text-black hover:bg-[#7a9e19]"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {generatingAI ? 'Generating...' : 'Generate AI Path'}
              </Button>

              {selectedPath?.type === 'ai_generated' && selectedPath.waypoints && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Generated Path Preview:</h4>
                  <div className="space-y-2">
                    {selectedPath.waypoints.map((stop, index) => (
                      <div key={stop.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                        <div className="bg-[#95C11F] text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="text-[#95C11F]">
                          {getStopIcon(stop.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{stop.name}</p>
                          <p className="text-xs text-muted-foreground">Day {stop.day} • {stop.estimated_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
