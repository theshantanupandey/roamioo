
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface UploadOptions {
  bucket: string;
  folder?: string;
  userId?: string;
  isPublic?: boolean;
}

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param options Upload options including bucket, folder, and userId
 * @returns URL of the uploaded file or error
 */
export async function uploadFile(file: File, options: UploadOptions): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { bucket, folder = '', userId = '', isPublic = true } = options;
    
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId ? `${userId}/` : ''}${uuidv4()}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { url: null, error: error as Error };
  }
}

/**
 * Delete a file from Supabase storage
 * @param bucket The bucket name
 * @param filePath The file path to delete
 * @returns Success status and error if any
 */
export async function deleteFile(bucket: string, filePath: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Extract file path from Supabase public URL
 * @param url The public URL of the file
 * @param bucket The bucket name
 * @returns File path for storage operations
 */
export function getFilePathFromUrl(url: string, bucket: string): string | null {
  try {
    // Get the base URL for the storage
    const { data } = supabase.storage.from(bucket).getPublicUrl('');
    // Extract the base part of the URL before the file path
    const baseUrl = data.publicUrl.substring(0, data.publicUrl.lastIndexOf('/') + 1);
    
    if (!url.startsWith(baseUrl)) return null;
    
    return url.replace(baseUrl, '');
  } catch (error) {
    console.error('Error extracting file path from URL:', error);
    return null;
  }
}
