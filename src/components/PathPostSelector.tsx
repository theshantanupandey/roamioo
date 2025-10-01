import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Map, Route, Star, Clock, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserPath {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  difficulty_level?: string;
  estimated_duration?: string;
  average_rating?: number;
  total_reviews?: number;
  created_at: string;
  waypoint_count: number;
}

interface PathPostSelectorProps {
  onPathSelect?: (pathId: string) => void;
  selectedPathId?: string;
}

export const PathPostSelector: React.FC<PathPostSelectorProps> = ({
  onPathSelect,
  selectedPathId
}) => {
  const [userPaths, setUserPaths] = useState<UserPath[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPaths = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('travel_paths')
          .select(`
            id,
            title,
            description,
            image_url,
            difficulty_level,
            estimated_duration,
            average_rating,
            total_reviews,
            created_at,
            path_waypoints (count)
          `)
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedPaths: UserPath[] = data?.map(path => ({
          id: path.id,
          title: path.title,
          description: path.description,
          image_url: path.image_url,
          difficulty_level: path.difficulty_level,
          estimated_duration: path.estimated_duration,
          average_rating: path.average_rating,
          total_reviews: path.total_reviews,
          created_at: path.created_at,
          waypoint_count: path.path_waypoints?.[0]?.count || 0
        })) || [];

        setUserPaths(formattedPaths);
      } catch (error) {
        console.error('Error fetching user paths:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your paths',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPaths();
  }, [user, toast]);

  const handleCreateNewPath = () => {
    navigate('/create-path');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed rounded-md p-6 animate-pulse bg-muted/20">
          <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-3" />
          <div className="h-4 bg-muted rounded mx-auto mb-2 w-32" />
          <div className="h-3 bg-muted rounded mx-auto w-24" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New Path Option */}
      <div
        className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleCreateNewPath}
      >
        <Map className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
        <p className="font-medium mb-2">Create a New Travel Path</p>
        <p className="text-sm text-muted-foreground mb-4">
          Share your journey with others
        </p>
        <Button className="bg-[#95C11F] text-black hover:bg-[#7a9e19]">
          <Plus className="mr-2 h-4 w-4" />
          Create Path
        </Button>
      </div>

      {userPaths.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Your Existing Paths</h3>
          <div className="space-y-3">
            {userPaths.map((path) => (
              <Card 
                key={path.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedPathId === path.id ? 'ring-2 ring-[#95C11F] bg-[#95C11F]/5' : ''
                }`}
                onClick={() => onPathSelect?.(path.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {path.image_url ? (
                      <div className="h-16 w-16 overflow-hidden rounded-md flex-shrink-0">
                        <img 
                          src={path.image_url}
                          alt={path.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        <Route className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm line-clamp-1">{path.title}</h4>
                        {path.average_rating && (
                          <Badge variant="secondary" className="ml-2 flex-shrink-0">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {path.average_rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      
                      {path.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {path.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{path.waypoint_count} stops</span>
                        </div>
                        {path.estimated_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{path.estimated_duration}</span>
                          </div>
                        )}
                        <span>• {formatTimeAgo(path.created_at)}</span>
                      </div>
                      
                      {path.difficulty_level && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {path.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {userPaths.length === 0 && !loading && (
        <div className="text-center py-8">
          <Route className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">You haven't created any paths yet</p>
          <Button 
            onClick={handleCreateNewPath}
            className="bg-[#95C11F] text-black hover:bg-[#7a9e19]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Path
          </Button>
        </div>
      )}
    </div>
  );
};
