
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

export interface Review {
  id?: string;
  place_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content?: string;
  visit_date?: string | null;
  image_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

// Function to fetch reviews for a place
export const fetchReviews = async (placeId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('place_reviews')
    .select(`
      id,
      place_id,
      user_id,
      rating,
      title,
      content,
      visit_date,
      image_urls,
      created_at,
      updated_at,
      users:user_id (username, profile_image_url)
    `)
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data || [];
};

// Function to create a new review
export const createReview = async ({
  review,
  images
}: {
  review: Review;
  images?: File[];
}): Promise<Review> => {
  let imageUrls: string[] = [];
  
  // Upload images if provided
  if (images && images.length > 0) {
    for (const file of images) {
      const { url, error } = await uploadFile(file, {
        bucket: 'reviews',
        folder: 'place-reviews',
        userId: review.user_id,
      });
      
      if (error) {
        console.error('Error uploading image:', error);
        continue;
      }
      
      if (url) {
        imageUrls.push(url);
      }
    }
  }
  
  // Create the review with image URLs
  const { data, error } = await supabase
    .from('place_reviews')
    .insert({
      ...review,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

// Hook for fetching reviews for a place
export function usePlaceReviews(placeId?: string) {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: () => fetchReviews(placeId || ''),
    enabled: !!placeId,
  });
}

// Hook for creating a new review
export function useCreateReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: createReview,
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['reviews', data.place_id] });
      queryClient.invalidateQueries({ queryKey: ['place', data.place_id] });
    },
  });
}

// Hook to check if user has already reviewed a place
export function useHasUserReviewed(placeId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userReview', placeId, user?.id],
    queryFn: async () => {
      if (!user || !placeId) return false;
      
      const { data, error } = await supabase
        .from('place_reviews')
        .select('id')
        .eq('place_id', placeId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return !!data;
    },
    enabled: !!(user && placeId),
  });
}
