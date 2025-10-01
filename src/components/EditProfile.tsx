
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Save, X, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  profile_image_url: string;
  city: string;
  country: string;
}

export default function EditProfile({ isOpen, onClose }: EditProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    first_name: '',
    last_name: '',
    bio: '',
    profile_image_url: '',
    city: '',
    country: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile();
    }
  }, [isOpen, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('username, first_name, last_name, bio, profile_image_url, city, country')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setProfile({
          username: data.username || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
          profile_image_url: data.profile_image_url || '',
          city: data.city || '',
          country: data.country || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, profile_image_url: previewUrl }));
      
      toast({
        title: "Image selected",
        description: "Image will be uploaded when you save your profile."
      });
    }
  };

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    try {
      setUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;
      
      // Delete old profile image if exists
      if (profile.profile_image_url && profile.profile_image_url.includes('supabase')) {
        const oldPath = profile.profile_image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('profiles').remove([`profiles/${oldPath}`]);
        }
      }
      
      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload profile image',
        variant: 'destructive'
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      let profileImageUrl = profile.profile_image_url;
      
      // Upload new image if one was selected
      if (selectedFile) {
        const uploadedUrl = await uploadProfileImage(selectedFile);
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }
      
      const { error } = await supabase
        .from('users')
        .update({
          username: profile.username,
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          profile_image_url: profileImageUrl,
          city: profile.city,
          country: profile.country
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });
      
      onClose();
      setSelectedFile(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile changes',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="container max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading || uploading}
            size="sm"
          >
            {saving || uploading ? 'Saving...' : 'Save'}
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-muted rounded-full animate-pulse" />
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                {profile.profile_image_url ? (
                  <AvatarImage src={profile.profile_image_url} alt="Profile" />
                ) : (
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <div className="flex items-center space-x-2 text-primary hover:underline">
                  <Camera className="h-4 w-4" />
                  <span>Change Photo</span>
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={profile.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Username"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={profile.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={profile.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={profile.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={profile.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
