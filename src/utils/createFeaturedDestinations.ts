
import { supabase } from '@/integrations/supabase/client';

interface FeaturedDestination {
  title: string;
  destination: string;
  description: string;
  start_date: string;
  end_date: string;
  privacy_level: string;
  image_url: string;
  budget: number;
  currency: string;
  status: string;
}

export const createFeaturedDestinations = async () => {
  const featuredDestinations: FeaturedDestination[] = [
    {
      title: "Enchanting Kyoto Adventure",
      destination: "Kyoto, Japan",
      description: "Discover the ancient temples, traditional gardens, and geisha districts of Japan's former capital. Experience the perfect blend of historical charm and modern culture.",
      start_date: "2024-03-15",
      end_date: "2024-03-22",
      privacy_level: "public",
      image_url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&h=300&fit=crop",
      budget: 2500,
      currency: "USD",
      status: "completed"
    },
    {
      title: "Santorini Sunset Paradise",
      destination: "Santorini, Greece",
      description: "Experience breathtaking sunsets, pristine white-washed buildings, and crystal-clear waters in this iconic Greek island paradise.",
      start_date: "2024-06-10",
      end_date: "2024-06-17",
      privacy_level: "public",
      image_url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=500&h=300&fit=crop",
      budget: 3200,
      currency: "USD",
      status: "completed"
    },
    {
      title: "Bali Tropical Escape",
      destination: "Bali, Indonesia",
      description: "Immerse yourself in lush rice terraces, ancient temples, vibrant culture, and pristine beaches. Perfect for relaxation and adventure.",
      start_date: "2024-08-05",
      end_date: "2024-08-14",
      privacy_level: "public",
      image_url: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=500&h=300&fit=crop",
      budget: 1800,
      currency: "USD",
      status: "completed"
    },
    {
      title: "Swiss Alps Mountain Retreat",
      destination: "Interlaken, Switzerland",
      description: "Adventure through majestic mountain peaks, pristine lakes, and charming alpine villages. Perfect for hiking and scenic train rides.",
      start_date: "2024-07-20",
      end_date: "2024-07-28",
      privacy_level: "public",
      image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop",
      budget: 4500,
      currency: "USD",
      status: "completed"
    },
    {
      title: "Iceland Northern Lights Quest",
      destination: "Reykjavik, Iceland",
      description: "Witness the magical Northern Lights, explore dramatic waterfalls, geysers, and volcanic landscapes in this Nordic wonderland.",
      start_date: "2024-11-15",
      end_date: "2024-11-23",
      privacy_level: "public",
      image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop",
      budget: 3800,
      currency: "USD",
      status: "planned"
    }
  ];

  try {
    // Create a demo user for these trips (if it doesn't exist)
    const { data: existingUser } = await supabase.auth.getUser();
    
    if (!existingUser.user) {
      console.log('No authenticated user found. Featured destinations need to be created by an authenticated user.');
      return;
    }

    // Insert featured destinations
    const { data, error } = await supabase
      .from('trips')
      .insert(
        featuredDestinations.map(dest => ({
          ...dest,
          user_id: existingUser.user.id
        }))
      )
      .select();

    if (error) {
      throw error;
    }

    console.log('Featured destinations created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating featured destinations:', error);
    throw error;
  }
};
