import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Route, 
  MapPin, 
  Star, 
  Clock, 
  Users,
  Eye,
  Utensils,
  Camera,
  Store,
  Compass
} from 'lucide-react';

interface PathStop {
  id: string;
  type: 'accommodation' | 'food' | 'attraction' | 'transport' | 'shopping';
  name: string;
  location: string;
  description: string;
  day: number;
  estimated_time?: string;
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
  waypoints?: PathStop[];
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  path_type?: 'none' | 'manual' | 'ai_generated' | 'existing';
  path_metadata?: any;
}

interface TripPathDisplayProps {
  trip: Trip;
  path?: TravelPath;
  onViewPath?: () => void;
  onFollowPath?: () => void;
  showActions?: boolean;
}

export const TripPathDisplay: React.FC<TripPathDisplayProps> = ({
  trip,
  path,
  onViewPath,
  onFollowPath,
  showActions = true
}) => {
  if (!path || trip.path_type === 'none') {
    return null;
  }

  const getStopIcon = (type: PathStop['type']) => {
    switch (type) {
      case 'accommodation': return <MapPin className="h-3 w-3" />;
      case 'food': return <Utensils className="h-3 w-3" />;
      case 'attraction': return <Camera className="h-3 w-3" />;
      case 'transport': return <Route className="h-3 w-3" />;
      case 'shopping': return <Store className="h-3 w-3" />;
      default: return <Compass className="h-3 w-3" />;
    }
  };

  const getPathTypeLabel = (type?: string) => {
    switch (type) {
      case 'manual': return 'Custom Path';
      case 'ai_generated': return 'AI Generated';
      case 'existing': return 'Popular Path';
      default: return 'Travel Path';
    }
  };

  const getPathTypeColor = (type?: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ai_generated': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'existing': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Group waypoints by day for better display
  const waypointsByDay = path.waypoints?.reduce((acc, waypoint) => {
    const day = waypoint.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(waypoint);
    return acc;
  }, {} as Record<number, PathStop[]>) || {};

  const totalDays = Object.keys(waypointsByDay).length;
  const totalStops = path.waypoints?.length || 0;

  return (
    <Card className="mt-3 border-l-4 border-l-[#95C11F]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-4 w-4 text-[#95C11F]" />
            <CardTitle className="text-base">{path.title}</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={getPathTypeColor(trip.path_type)}
          >
            {getPathTypeLabel(trip.path_type)}
          </Badge>
        </div>
        {path.description && (
          <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Path Stats */}
        <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
          {totalDays > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
            </div>
          )}
          {totalStops > 0 && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{totalStops} stops</span>
            </div>
          )}
          {path.average_rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{path.average_rating.toFixed(1)}</span>
            </div>
          )}
          {path.estimated_duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{path.estimated_duration}</span>
            </div>
          )}
        </div>

        {/* Preview of first few stops */}
        {totalStops > 0 && (
          <div className="space-y-2 mb-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Highlights
            </h4>
            <div className="space-y-1">
              {path.waypoints?.slice(0, 3).map((waypoint, index) => (
                <div key={waypoint.id} className="flex items-center gap-2 text-sm">
                  <div className="text-[#95C11F]">
                    {getStopIcon(waypoint.type)}
                  </div>
                  <span className="font-medium">{waypoint.name}</span>
                  <span className="text-xs text-muted-foreground">• Day {waypoint.day}</span>
                  {waypoint.estimated_time && (
                    <span className="text-xs text-muted-foreground">• {waypoint.estimated_time}</span>
                  )}
                </div>
              ))}
              {totalStops > 3 && (
                <div className="text-xs text-muted-foreground pl-5">
                  +{totalStops - 3} more stops...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            {onViewPath && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onViewPath}
                className="flex-1"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Path
              </Button>
            )}
            {onFollowPath && trip.path_type === 'existing' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onFollowPath}
                className="flex-1 border-[#95C11F] text-[#95C11F] hover:bg-[#95C11F]/10"
              >
                <Users className="h-3 w-3 mr-1" />
                Follow Path
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
