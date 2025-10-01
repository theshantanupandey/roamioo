import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { format } from 'date-fns';
import { Calendar, MapPin, CreditCard, Trash, FileEdit, Send, Route } from 'lucide-react';
import { PathService } from '@/services/PathService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// This is a subset of the full Trip type
interface Trip {
  id: string;
  title: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  image_url?: string;
  budget?: number;
  currency?: string;
  path_id?: string;
  path_type?: 'none' | 'manual' | 'ai_generated' | 'existing';
  path_metadata?: any;
}
interface TripCardProps {
  trip: Trip;
  showEdit?: boolean;
  showDelete?: boolean;
  onDelete?: (tripId: string) => void;
  showPost?: boolean;
  onPost?: (trip: Trip) => void;
  showSharePath?: boolean;
  onSharePath?: (trip: Trip) => void;
}

export const TripCard = ({
  trip,
  showEdit = false,
  showDelete = false,
  onDelete,
  showPost = false,
  onPost,
  showSharePath = false,
  onSharePath,
}: TripCardProps) => {
  const { id, title, destination, start_date, end_date, status, image_url, budget, currency, path_id, path_type } = trip;
  const startDate = start_date ? new Date(start_date) : null;
  const endDate = end_date ? new Date(end_date) : null;
  const { toast } = useToast();

  const [open, setOpen] = useState(false);

  const handleSharePath = async () => {
    if (!path_id) {
      toast({
        title: 'No Path Found',
        description: 'This trip does not have an associated travel path',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await PathService.sharePathAsPost(path_id, trip.user_id || '', {
        customMessage: `Check out the amazing travel path I created for my trip to ${destination}! 🗺️`,
        makePublic: true
      });

      if (result.success) {
        toast({
          title: 'Path Shared!',
          description: 'Your travel path has been shared as a post'
        });
        if (onSharePath) {
          onSharePath(trip);
        }
      } else {
        toast({
          title: 'Share Failed',
          description: result.error || 'Failed to share path',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="bg-card border-border shadow-md rounded-lg overflow-hidden relative">
      {image_url && (
        <Link to={`/trips/${id}`}>
          <img src={image_url} alt={title} className="w-full h-48 object-cover" />
        </Link>
      )}
      {/* Action buttons - now permanently visible */}
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        {showPost && onPost && (
          <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-green-100 dark:hover:bg-green-900/30" onClick={() => onPost(trip)}>
            <Send className="h-5 w-5 text-green-600" />
          </Button>
        )}
        {showSharePath && path_id && path_type !== 'none' && (
          <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-purple-100 dark:hover:bg-purple-900/30" onClick={handleSharePath}>
            <Route className="h-5 w-5 text-purple-600" />
          </Button>
        )}
        {showEdit && (
          <Link to={`/trips/${id}?edit=true`}>
            <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-blue-100 dark:hover:bg-blue-900/30">
              <FileEdit className="h-5 w-5 text-blue-600" />
            </Button>
          </Link>
        )}
        {showDelete && onDelete && (
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-background/80 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={(e) => { e.preventDefault(); setOpen(true); }}>
                <Trash className="h-5 w-5 text-red-600" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className="font-bold">{title}</span>? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => { setOpen(false); onDelete(id); }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <CardHeader>
        <CardTitle>
          <Link to={`/trips/${id}`} className="hover:underline underline-offset-2">
            {title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{destination}</p>
        </div>
        {startDate && (
          <div className="flex items-center mb-2">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {format(startDate, 'MMM dd, yyyy')} - {endDate ? format(endDate, 'MMM dd, yyyy') : 'Ongoing'}
            </p>
          </div>
        )}
        {budget && (
          <div className="flex items-center mb-2">
            <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Budget: {currency} {budget}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-4">
        <div className="flex items-center justify-between w-full">
          <Badge
            variant={
              status === 'draft'
                ? 'secondary'
                : status === 'planned'
                  ? 'outline'
                  : status === 'active'
                    ? 'default'
                    : status === 'completed'
                      ? 'default'
                      : 'destructive'
            }
          >
            {status}
          </Badge>
          
          {path_id && path_type !== 'none' && (
            <Badge variant="outline" className="bg-[#95C11F]/10 text-[#95C11F] border-[#95C11F]/20">
              <Route className="h-3 w-3 mr-1" />
              {path_type === 'manual' ? 'Custom Path' : 
               path_type === 'ai_generated' ? 'AI Path' : 
               path_type === 'existing' ? 'Popular Path' : 'Path'}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
