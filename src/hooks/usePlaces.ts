
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Place {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  image_urls?: string[];
  average_rating?: number;
  total_reviews?: number;
  distance?: string;
  phone?: string;
  website?: string;
}

export const useNearbyPlaces = (
  lat?: number,
  lng?: number,
  radius: number = 50,
  category?: string
) => {
  return useQuery({
    queryKey: ['nearby-places', lat, lng, radius, category],
    queryFn: async () => {
      if (!lat || !lng) return [];
      
      let query = supabase
        .from('places')
        .select('*')
        .order('average_rating', { ascending: false });
        
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate distance for each place
      const placesWithDistance = data?.map(place => ({
        ...place,
        distance: calculateDistance(lat, lng, place.latitude || 0, place.longitude || 0)
      })) || [];
      
      // Filter by radius and sort by distance
      return placesWithDistance
        .filter(place => parseFloat(place.distance.replace(' km', '')) <= radius)
        .sort((a, b) => parseFloat(a.distance.replace(' km', '')) - parseFloat(b.distance.replace(' km', '')));
    },
    enabled: !!lat && !!lng,
  });
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return `${d.toFixed(1)} km`;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
