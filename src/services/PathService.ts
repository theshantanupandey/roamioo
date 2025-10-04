import { supabase } from '@/integrations/supabase/client';

export interface PathShareOptions {
  includeWaypoints?: boolean;
  makePublic?: boolean;
  customMessage?: string;
}

export class PathService {
  
  /**
   * Share a travel path as a post
   */
  static async sharePathAsPost(
    pathId: string, 
    userId: string, 
    options: PathShareOptions = {}
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    try {
      // Fetch the path details
      const { data: pathData, error: pathError } = await supabase
        .from('travel_paths')
        .select(`
          *,
          path_waypoints (
            id, title, description, order_index, estimated_time,
            latitude, longitude
          )
        `)
        .eq('id', pathId)
        .single();

      if (pathError || !pathData) {
        return { success: false, error: 'Path not found' };
      }

      // Create post content
      const waypointCount = pathData.path_waypoints?.length || 0;
      const defaultMessage = `Check out this amazing travel path I created! 🗺️\n\n"${pathData.title}" includes ${waypointCount} carefully planned stops. Perfect for exploring and discovering new places!`;
      
      const postContent = options.customMessage || defaultMessage;

      // Create the post with path_id reference
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          content: postContent,
          user_id: userId,
          path_id: pathId,
          image_urls: [],
          privacy_level: 'public'
        })
        .select()
        .single();

      if (postError || !postData) {
        return { success: false, error: 'Failed to create post' };
      }

      // Optionally make the path public
      if (options.makePublic && !pathData.is_public) {
        await supabase
          .from('travel_paths')
          .update({ is_public: true })
          .eq('id', pathId);
      }

      return { 
        success: true, 
        postId: postData.id 
      };

    } catch (error) {
      console.error('Error sharing path as post:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Create a path from trip data
   */
  static async createPathFromTrip(
    tripId: string,
    userId: string,
    waypoints: any[]
  ): Promise<{ success: boolean; pathId?: string; error?: string }> {
    try {
      // Get trip details
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (tripError || !tripData) {
        return { success: false, error: 'Trip not found' };
      }

      // Create the path
      const pathData = {
        title: `${tripData.title} - Travel Path`,
        description: `Travel path for ${tripData.destination}`,
        created_by: userId,
        is_public: false,
        estimated_duration: `${Math.ceil(
          (new Date(tripData.end_date).getTime() - new Date(tripData.start_date).getTime()) 
          / (1000 * 60 * 60 * 24)
        )} days`
      };

      const { data: newPath, error: pathError } = await supabase
        .from('travel_paths')
        .insert(pathData)
        .select()
        .single();

      if (pathError || !newPath) {
        return { success: false, error: 'Failed to create path' };
      }

      // Create waypoints
      if (waypoints.length > 0) {
        const waypointData = waypoints.map((waypoint, index) => ({
          path_id: newPath.id,
          title: waypoint.name,
          description: waypoint.description,
          order_index: index + 1,
          estimated_time: waypoint.estimated_time,
          latitude: waypoint.latitude,
          longitude: waypoint.longitude
        }));

        const { error: waypointsError } = await supabase
          .from('path_waypoints')
          .insert(waypointData);

        if (waypointsError) {
          console.error('Error creating waypoints:', waypointsError);
          // Continue anyway, path is created
        }
      }

      return { 
        success: true, 
        pathId: newPath.id 
      };

    } catch (error) {
      console.error('Error creating path from trip:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Follow/unfollow a path
   */
  static async toggleFollowPath(
    pathId: string, 
    userId: string
  ): Promise<{ success: boolean; isFollowing?: boolean; error?: string }> {
    try {
      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('user_followed_paths')
        .select('id')
        .eq('path_id', pathId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        return { success: false, error: 'Failed to check follow status' };
      }

      if (existingFollow) {
        // Unfollow
        const { error: unfollowError } = await supabase
          .from('user_followed_paths')
          .delete()
          .eq('path_id', pathId)
          .eq('user_id', userId);

        if (unfollowError) {
          return { success: false, error: 'Failed to unfollow path' };
        }

        return { success: true, isFollowing: false };
      } else {
        // Follow
        const { error: followError } = await supabase
          .from('user_followed_paths')
          .insert({
            path_id: pathId,
            user_id: userId,
            status: 'following'
          });

        if (followError) {
          return { success: false, error: 'Failed to follow path' };
        }

        return { success: true, isFollowing: true };
      }

    } catch (error) {
      console.error('Error toggling path follow:', error);
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      };
    }
  }

  /**
   * Get paths followed by a user
   */
  static async getUserFollowedPaths(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_followed_paths')
        .select(`
          id,
          status,
          started_at,
          completed_at,
          path:path_id (
            id,
            title,
            description,
            image_url,
            difficulty_level,
            estimated_duration,
            average_rating,
            total_reviews,
            path_waypoints (count)
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching followed paths:', error);
      return { success: false, error: 'Failed to fetch followed paths' };
    }
  }
}
