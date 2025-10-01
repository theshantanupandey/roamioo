
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Store, Coffee, Hotel, MapPin, Navigation, Phone, Globe, Clock, Star, MessageSquare, User, PenLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDevice } from '@/hooks/use-device';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  username?: string;
  user_id: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
  title?: string;
}

interface Place {
  id: string;
  name: string;
  type: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  image: string;
  distance?: string;
  lat?: number;
  lng?: number;
  description?: string;
  phone?: string;
  website?: string;
  hours?: string;
  reviews?: Review[];
}

interface PlaceDetailsProps {
  place: Place | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  restaurant: <Store className="h-5 w-5" />,
  cafe: <Coffee className="h-5 w-5" />,
  hotel: <Hotel className="h-5 w-5" />,
  shop: <Store className="h-5 w-5" />,
  scenic: <MapPin className="h-5 w-5" />,
};

// AI generated review summary based on the reviews
const getReviewSummary = (reviews: Review[]): string => {
  if (!reviews || reviews.length === 0) {
    return "No reviews yet. Be the first to share your experience!";
  }
  
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  if (avgRating >= 4.5) {
    return "Visitors consistently praise this place for its exceptional quality, excellent service, and wonderful atmosphere. Many reviewers highlight it as a must-visit destination.";
  } else if (avgRating >= 4) {
    return "This place receives very positive feedback from most visitors. People appreciate the quality, though some mention minor issues with crowding at peak times.";
  } else if (avgRating >= 3) {
    return "Reviews are generally positive with most visitors enjoying their experience. Some improvements could be made to consistency and service.";
  } else {
    return "Visitors have mixed experiences at this location. While some enjoy certain aspects, others mention areas that need improvement.";
  }
};

export const PlaceDetails: React.FC<PlaceDetailsProps> = ({ place, open, onOpenChange }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDesktop } = useDevice();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchReviews = async () => {
      if (!place || !open) return;
      
      setIsLoading(true);
      try {
        // Fetch reviews for this place
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('place_reviews')
          .select(`
            id,
            user_id,
            rating,
            title,
            content,
            visit_date,
            created_at,
            image_urls
          `)
          .eq('place_id', place.id)
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (reviewsError) throw reviewsError;
        
        // Get user information for each review
        const reviewsWithUserInfo = await Promise.all(
          (reviewsData || []).map(async (review) => {
            // Fetch user details
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('username, profile_image_url')
              .eq('id', review.user_id)
              .single();
              
            // Format the review
            return {
              id: review.id,
              user_id: review.user_id,
              username: userData?.username || 'Anonymous User',
              avatar: userData?.profile_image_url || undefined,
              rating: review.rating,
              date: formatDate(review.created_at),
              title: review.title || '',
              text: review.content || ''
            };
          })
        );
        
        setReviews(reviewsWithUserInfo);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [place, open]);
  
  if (!place) return null;
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  };
  
  const reviewSummary = getReviewSummary(reviews);
  
  const handleOpenDirections = () => {
    if (place.lat && place.lng) {
      // In a real app, this would open Google Maps with directions
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
      window.open(mapsUrl, '_blank');
    } else {
      // Fallback to search by name and address
      const searchQuery = encodeURIComponent(`${place.name} ${place.address || ''}`);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
      window.open(mapsUrl, '_blank');
    }
    
    toast({
      title: "Opening directions",
      description: `Finding route to ${place.name}`,
    });
  };

  const handleViewReviews = () => {
    toast({
      title: "Reviews",
      description: `Showing reviews for ${place.name}`,
    });
  };

  const handleNavigateToReviewPage = () => {
    onOpenChange(false); // Close the details modal
    navigate(`/place/review/${place.id}`, { 
      state: { 
        place: place 
      } 
    });
  };

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        <span className="text-yellow-500 flex mr-1">
          {[...Array(Math.floor(rating))].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
          {rating % 1 > 0 && <Star className="h-4 w-4 fill-current" />}
        </span>
        <span className="text-sm">{rating}</span>
        <span className="text-xs text-muted-foreground ml-1">({place.reviewCount || reviews.length})</span>
      </div>
    );
  };

  // Adjust the width based on desktop view
  const sheetWidth = isDesktop ? "sm:max-w-lg md:max-w-xl lg:max-w-2xl" : "sm:max-w-md";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={`overflow-y-auto w-full ${sheetWidth}`}>
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">{place.name}</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          <AspectRatio ratio={16/9} className="overflow-hidden rounded-lg">
            <img 
              src={place.image} 
              alt={place.name}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="capitalize">
                {typeIcons[place.type as keyof typeof typeIcons]}
                <span className="ml-1">{place.type}</span>
              </Badge>
              {place.distance && <Badge variant="outline">{place.distance}</Badge>}
            </div>
            {renderRatingStars(place.rating || 0)}
          </div>

          {/* Location Section - Moved to top */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-sm text-muted-foreground">{place.address}</p>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleOpenDirections}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* About Section - Moved to top */}
          {place.description && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">{place.description}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Details Section - Moved to top */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Details</h3>
              
              <div className={`${isDesktop ? "grid grid-cols-3 gap-4" : "space-y-4"}`}>
                {place.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${place.phone}`} className="text-sm hover:underline">{place.phone}</a>
                  </div>
                )}
                
                {place.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate">{place.website}</a>
                  </div>
                )}
                
                {place.hours && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{place.hours}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Reviews Section - With Write Review button */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                  Reviews & Ratings 
                  <Badge className="ml-2 bg-yellow-500 text-black">
                    {place.rating?.toFixed(1) || "New"}
                  </Badge>
                </h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNavigateToReviewPage}
                  className="text-xs flex items-center"
                >
                  <PenLine className="h-3 w-3 mr-1" />
                  Write Review
                </Button>
              </div>
              
              {/* AI Review Summary */}
              <div className="bg-muted/40 p-3 rounded-md text-sm border-l-4 border-[#95C11F]">
                <p className="italic text-muted-foreground">{reviewSummary}</p>
              </div>
              
              {/* Reviews List */}
              <div className="space-y-4 mt-4">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span className="text-sm text-muted-foreground">Loading reviews...</span>
                    </div>
                  </div>
                ) : reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.avatar} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{review.username}</p>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-yellow-500 flex mr-1">
                            {[...Array(Math.floor(review.rating))].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                            {review.rating % 1 > 0 && <Star className="h-3 w-3 fill-current" />}
                          </span>
                        </div>
                      </div>
                      {review.title && <p className="text-sm font-medium">{review.title}</p>}
                      <p className="text-sm">{review.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-2">
                    No reviews yet. Be the first to write one!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <SheetFooter className="flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleViewReviews}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              See All Reviews
            </Button>
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">Close</Button>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PlaceDetails;
