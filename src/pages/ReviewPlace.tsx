import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Star, Image as ImageIcon, Loader2, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from '@/components/ui/skeleton';

// Define our validation schema with zod
const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  text: z.string().min(5, "Review must be at least 5 characters").max(500),
  visitDate: z.string().optional()
});
type ReviewFormValues = z.infer<typeof reviewSchema>;

// TypeScript interface for Place
interface Place {
  id: string;
  name: string;
  category?: string;
  rating?: number;
  total_reviews?: number;
  address?: string;
  image_urls?: string[];
  distance?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  phone?: string;
  website?: string;
  opening_hours?: object;
}
const ReviewPlace = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    user
  } = useAuth();

  // Get place data from location state or fetch it based on ID
  const [place, setPlace] = useState<Place | null>(location.state?.place || null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      text: '',
      visitDate: ''
    }
  });

  // Fetch place data if not provided in location state
  useEffect(() => {
    const fetchPlace = async () => {
      if (!id) {
        navigate('/nearby-places');
        return;
      }
      try {
        setLoading(true);
        const {
          data,
          error
        } = await supabase.from('places').select('*').eq('id', id).single();
        if (error) {
          throw error;
        }
        if (data) {
          setPlace({
            id: data.id,
            name: data.name,
            category: data.category,
            address: data.address,
            image_urls: data.image_urls,
            description: data.description,
            rating: data.average_rating,
            total_reviews: data.total_reviews,
            phone: data.phone,
            website: data.website,
            latitude: data.latitude,
            longitude: data.longitude
          });
        } else {
          throw new Error("Place not found");
        }
      } catch (error) {
        console.error('Error fetching place:', error);
        toast({
          title: "Error",
          description: "Failed to load place information. Please try again.",
          variant: "destructive"
        });
        navigate('/nearby-places');
      } finally {
        setLoading(false);
      }
    };
    if (!place && id) {
      fetchPlace();
    } else {
      setLoading(false);
    }
  }, [id, place, navigate, toast]);

  // Check if user has already reviewed this place
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user || !id) return;
      try {
        const {
          data,
          error
        } = await supabase.from('place_reviews').select('id').eq('user_id', user.id).eq('place_id', id).maybeSingle();
        if (error) {
          console.error('Error checking for existing review:', error);
        }
        if (data) {
          toast({
            title: "Review exists",
            description: "You have already reviewed this place. You can edit your review from your profile."
          });
          navigate(`/places/${id}`);
        }
      } catch (error) {
        console.error('Error checking for existing review:', error);
      }
    };
    checkExistingReview();
  }, [user, id, navigate, toast]);

  // If no place data, redirect to nearby places
  if (!place && !isSuccess && !loading) {
    navigate('/nearby-places');
    return null;
  }
  if (loading) {
    return <div className="container max-w-3xl pb-24 pt-6 px-4">
        <Button variant="ghost" size="sm" className="mb-4" disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="h-12 w-3/4 bg-muted/50 rounded-md mb-2"></div>
        <div className="h-6 w-1/2 bg-muted/40 rounded-md mb-8"></div>
        
        <Card className="overflow-hidden mb-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <Skeleton className="h-full aspect-square" />
            </div>
            <div className="sm:col-span-2 p-4">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </Card>
        
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>;
  }
  const handleGoBack = () => {
    navigate(-1);
  };
  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    form.setValue('rating', rating);
  };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Limit to 5 images total
    const remainingSlots = 5 - uploadedImages.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limit reached",
        description: "You can only upload up to 5 images."
      });
      return;
    }
    const newImages: string[] = [];
    const newFiles: File[] = [];
    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      const imageUrl = URL.createObjectURL(file);
      newImages.push(imageUrl);
      newFiles.push(file);
    }
    setUploadedImages([...uploadedImages, ...newImages]);
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    const newFiles = [...uploadedFiles];
    URL.revokeObjectURL(newImages[index]);
    newImages.splice(index, 1);
    newFiles.splice(index, 1);
    setUploadedImages(newImages);
    setUploadedFiles(newFiles);
  };
  const onSubmit = async (data: ReviewFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to submit a review.",
        variant: "destructive"
      });
      navigate('/login', {
        state: {
          returnUrl: `/place/review/${id}`
        }
      });
      return;
    }
    if (!id) {
      toast({
        title: "Invalid place",
        description: "Could not identify the place to review.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Upload images to storage if any
      const imageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `place-reviews/${user.id}/${fileName}`;
          const {
            error: uploadError
          } = await supabase.storage.from('reviews').upload(filePath, file);
          if (uploadError) {
            throw uploadError;
          }

          // Get the public URL
          const {
            data: publicUrl
          } = supabase.storage.from('reviews').getPublicUrl(filePath);
          imageUrls.push(publicUrl.publicUrl);
        }
      }

      // Submit the review to the database
      const {
        error
      } = await supabase.from('place_reviews').insert({
        place_id: id,
        user_id: user.id,
        rating: data.rating,
        title: data.title,
        content: data.text,
        visit_date: data.visitDate || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null
      });
      if (error) {
        throw error;
      }

      // Update the place's rating and review count
      // In a real-world app, this would typically be handled by a database trigger or a server function
      const {
        data: placeData,
        error: placeError
      } = await supabase.from('places').select('average_rating, total_reviews').eq('id', id).single();
      if (!placeError && placeData) {
        const totalReviews = (placeData.total_reviews || 0) + 1;
        const currentRatingTotal = (placeData.average_rating || 0) * (placeData.total_reviews || 0);
        const newAvgRating = (currentRatingTotal + data.rating) / totalReviews;
        await supabase.from('places').update({
          average_rating: newAvgRating,
          total_reviews: totalReviews
        }).eq('id', id);
      }
      setIsSuccess(true);
      toast({
        title: "Review submitted",
        description: "Thank you for your review!"
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isSuccess) {
    return <div className="container max-w-3xl py-8 px-4">
        <Card className="text-center py-10">
          <CardContent className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-[#95C11F]" />
            <CardTitle className="text-2xl">Review Submitted!</CardTitle>
            <CardDescription className="text-lg">
              Thank you for sharing your experience with the community.
            </CardDescription>
            <div className="pt-6">
              <Button onClick={() => navigate(`/places/${id || ''}`)}>
                Back to Place Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="container max-w-3xl pb-24 pt-6 px-4">
      
      
      <PageHeader heading="Write a Review" subheading={`Share your experience at ${place?.name}`} />
      
      {/* Place card summary */}
      <div className="mb-8">
        <Card className="overflow-hidden">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <AspectRatio ratio={1 / 1}>
                <img src={place?.image_urls && place.image_urls.length > 0 ? place.image_urls[0] : '/placeholder.svg'} alt={place?.name} className="object-cover w-full h-full" />
              </AspectRatio>
            </div>
            <div className="sm:col-span-2 p-4">
              <h2 className="font-bold text-lg">{place?.name}</h2>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="capitalize">
                  {place?.category || 'Place'}
                </Badge>
                {place?.rating && <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {place.rating.toFixed(1)} ({place.total_reviews || 0})
                  </Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{place?.address}</p>
            </div>
          </div>
        </Card>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Rating */}
          <FormField control={form.control} name="rating" render={({
          field
        }) => <FormItem className="space-y-1">
                <FormLabel className="text-lg">Your Rating</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map(rating => <Button key={rating} type="button" variant="ghost" size="sm" className={`p-1 hover:bg-transparent ${rating <= selectedRating ? 'text-yellow-500' : 'text-muted-foreground'}`} onClick={() => handleRatingClick(rating)}>
                        <Star className="h-10 w-10" fill={rating <= selectedRating ? 'currentColor' : 'none'} />
                      </Button>)}
                    <input type="hidden" {...field} value={field.value} />
                  </div>
                </FormControl>
                {selectedRating === 0 && <FormMessage>Please select a rating</FormMessage>}
              </FormItem>} />
          
          <Separator />
          
          {/* Review Title */}
          <FormField control={form.control} name="title" render={({
          field
        }) => <FormItem>
                <FormLabel>Review Title</FormLabel>
                <FormControl>
                  <Input placeholder="Summarize your experience" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>} />
          
          {/* Review Text */}
          <FormField control={form.control} name="text" render={({
          field
        }) => <FormItem>
                <FormLabel>Your Review</FormLabel>
                <FormControl>
                  <Textarea placeholder="Tell others about your experience" className="min-h-[150px] resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>} />
          
          {/* Visit Date */}
          <FormField control={form.control} name="visitDate" render={({
          field
        }) => <FormItem>
                <FormLabel>When did you visit?</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>} />
          
          {/* Image Upload */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Add Photos</h3>
              <p className="text-xs text-muted-foreground">{uploadedImages.length}/5</p>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {uploadedImages.map((img, index) => <div key={index} className="relative group aspect-square">
                  <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                  <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>)}
              
              {uploadedImages.length < 5 && <button type="button" onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-md flex items-center justify-center aspect-square">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </button>}
            </div>
            <p className="text-xs text-muted-foreground">Add up to 5 photos to share your experience</p>
          </div>
          
          {/* Submit Button */}
          <Button type="submit" className="w-full bg-[#95C11F] hover:bg-[#7a9e19] text-black" disabled={isSubmitting}>
            {isSubmitting ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </> : 'Submit Review'}
          </Button>
        </form>
      </Form>
    </div>;
};
export default ReviewPlace;