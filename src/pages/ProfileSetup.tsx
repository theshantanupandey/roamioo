import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Check, User, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, needsProfileSetup, refreshProfileSetupStatus } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    bio: '',
    avatarUrl: '',
    location: ''
  });
  
  const totalSteps = 4;
  
  // Redirect if user doesn't need profile setup
  useEffect(() => {
    if (user && !needsProfileSetup) {
      navigate('/', { replace: true });
    }
  }, [user, needsProfileSetup, navigate]);
  
  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Check username availability with debounce
  useEffect(() => {
    if (profile.username.length >= 3) {
      const timeoutId = setTimeout(async () => {
        await checkUsernameAvailability(profile.username);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameAvailable(null);
    }
  }, [profile.username]);

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) return;
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      
      if (error) throw error;
      
      setUsernameAvailable(!data);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };
  
  const handleNext = async () => {
    if (step === 1) {
      if (!profile.username) {
        toast({
          title: "Username required",
          description: "Please enter a username to continue.",
          variant: "destructive"
        });
        return;
      }
      
      if (profile.username.length < 3) {
        toast({
          title: "Username too short",
          description: "Username must be at least 3 characters long.",
          variant: "destructive"
        });
        return;
      }
      
      if (usernameAvailable === false) {
        toast({
          title: "Username not available",
          description: "This username is already taken. Please choose another one.",
          variant: "destructive"
        });
        return;
      }
      
      if (usernameAvailable === null) {
        toast({
          title: "Checking username",
          description: "Please wait while we check username availability.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSkip = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
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
      
      // Upload image
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
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const url = URL.createObjectURL(file);
      setProfile(prev => ({
        ...prev,
        avatarUrl: url
      }));
    }
  };

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to complete your profile.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      let avatarUrl = profile.avatarUrl;
      
      // Upload image if one was selected
      if (selectedFile) {
        const uploadedUrl = await uploadProfileImage(selectedFile);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Split full name into first and last name
      const nameParts = profile.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Split location into city and country (assuming format "City, Country")
      const locationParts = profile.location.split(',').map(part => part.trim());
      const city = locationParts[0] || '';
      const country = locationParts[1] || '';
      
      // Save profile data to users table
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          username: profile.username,
          first_name: firstName,
          last_name: lastName,
          bio: profile.bio,
          profile_image_url: avatarUrl,
          city: city,
          country: country,
          password_hash: 'handled_by_auth', // This is managed by Supabase Auth
          email_verified: true
        });
        
      if (error) {
        throw error;
      }
      
      // Refresh the profile setup status in the auth context
      await refreshProfileSetupStatus();
      
      toast({
        title: "Profile setup complete!",
        description: "Welcome to Roamio!"
      });
      
      // Navigate to home page
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Don't render if user is not authenticated or doesn't need setup
  if (!user || !needsProfileSetup) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-14 max-w-md mx-auto px-4">
          {step > 1 ? (
            <Button variant="ghost" size="icon" onClick={handleBack} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div></div> 
          )}
          
          <div className="font-medium">Set up your profile</div>
          
          <Button variant="ghost" onClick={handleSkip} className="text-sm text-muted-foreground">
            Skip
          </Button>
        </div>
        <Progress value={(step / totalSteps) * 100} className="h-1" />
      </header>
      
      <main className="flex-1 container max-w-md mx-auto px-4 py-8">
        <Card className="p-6 shadow-md">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Choose your username</h1>
                <p className="text-muted-foreground">This will be your unique identifier on Roamio.</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    placeholder="Username"
                    className="text-center"
                  />
                  {profile.username.length >= 3 && (
                    <div className="mt-2 text-center text-sm">
                      {checkingUsername ? (
                        <span className="text-muted-foreground">Checking availability...</span>
                      ) : usernameAvailable === true ? (
                        <span className="text-green-600">✓ Username available</span>
                      ) : usernameAvailable === false ? (
                        <span className="text-red-600">✗ Username not available</span>
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Username must be at least 3 characters long. You can change this later in your settings.
                </p>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Add your name</h1>
                <p className="text-muted-foreground">Help people discover your account</p>
              </div>
              
              <div className="space-y-4">
                <Input
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="text-center"
                />
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Add a profile photo</h1>
                <p className="text-muted-foreground">Add a photo so people can recognize you</p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt="Profile" />
                  ) : (
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 text-primary hover:underline">
                    <Camera className="h-4 w-4" />
                    <span>{profile.avatarUrl ? "Change photo" : "Upload a photo"}</span>
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">Add your bio</h1>
                <p className="text-muted-foreground">Tell others about yourself</p>
              </div>
              
              <div className="space-y-4">
                <Textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  placeholder="Bio"
                  rows={4}
                />
                
                <Input
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="Location (optional)"
                  className="mt-4"
                />
              </div>
            </div>
          )}
        </Card>
      </main>
      
      <footer className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="container max-w-md mx-auto">
          <Button 
            className="w-full bg-[#e2fa3e] hover:bg-[#d5ec35] text-black" 
            onClick={handleNext}
            disabled={saving || checkingUsername || (step === 1 && usernameAvailable !== true)}
          >
            {saving ? (
              <span className="flex items-center">
                Saving... <div className="ml-2 w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              </span>
            ) : step === totalSteps ? (
              <span className="flex items-center">
                Complete <Check className="ml-2 h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
