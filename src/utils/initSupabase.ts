
import { supabase } from '@/integrations/supabase/client';

export async function initializeSupabaseStorage() {
  try {
    // Check if buckets exist instead of trying to create them
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return;
    }

    const requiredBuckets = ['reviews', 'profiles', 'travel-paths', 'posts'];
    const existingBuckets = buckets?.map(bucket => bucket.name) || [];
    
    console.log('Existing storage buckets:', existingBuckets);
    
    // Log which buckets are available
    requiredBuckets.forEach(bucketName => {
      if (existingBuckets.includes(bucketName)) {
        console.log(`✓ Storage bucket '${bucketName}' is available`);
      } else {
        console.warn(`⚠ Storage bucket '${bucketName}' is missing`);
      }
    });
  } catch (error) {
    console.error('Error initializing Supabase storage:', error);
  }
}
