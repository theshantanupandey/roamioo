import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { X, Camera, Map, Image as ImageIcon, Route, Calendar, Users, DollarSign, Instagram, Share2, Video, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile } from '@/utils/storage';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { ImageCropper } from '@/components/ImageCropper';
import { PathSelector, PathSelection } from '@/components/PathSelector';
import { PathPostSelector } from '@/components/PathPostSelector';
import { PathService } from '@/services/PathService';
import { useUserSearch, UserProfile } from '@/hooks/useUserSearch'; // Import useUserSearch and UserProfile
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { GroupChatService } from '@/services/GroupChatService';

const CreatePost = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [postType, setPostType] = useState<'photo' | 'video' | 'path' | 'trip'>('photo');
  const [postImage, setPostImage] = useState('');
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postVideo, setPostVideo] = useState('');
  const [postVideoFile, setPostVideoFile] = useState<File | null>(null);
  const [postCaption, setPostCaption] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Trip specific states
  const [tripTitle, setTripTitle] = useState('');
  const [tripDate, setTripDate] = useState<Date | undefined>(undefined);
  const [tripEndDate, setTripEndDate] = useState<Date | undefined>(undefined);
  const [tripSpots, setTripSpots] = useState<number>(3);
  const [tripDescription, setTripDescription] = useState('');
  const [tripBudget, setTripBudget] = useState('');
  const [pathSelection, setPathSelection] = useState<PathSelection>({ type: 'none' });
  const [selectedCompanions, setSelectedCompanions] = useState<UserProfile[]>([]); // New state for companions
  const [createTripGroupChat, setCreateTripGroupChat] = useState(false); // New state for group chat checkbox

  // User search for companions
  const { searchQuery, setSearchQuery, searchResults, loading: searchingUsers } = useUserSearch();

  // Path posting states
  const [selectedPathId, setSelectedPathId] = useState<string>('');

  // Cross-posting states
  const [crossPostToInstagram, setCrossPostToInstagram] = useState(false);
  
  // Add new state for aspect ratio
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number>(0); // 0 means original
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('');

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file change with actual file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected image file:', file.name, 'Size:', formatFileSize(file.size));
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB for images)
      const maxImageSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxImageSize) {
        toast({
          title: "File too large",
          description: `Please select an image smaller than 10MB. Current size: ${formatFileSize(file.size)}`,
          variant: "destructive"
        });
        return;
      }

      // Create preview URL and store file
      const previewUrl = URL.createObjectURL(file);
      setPostImage(previewUrl);
      setPostImageFile(file);
      setCroppedImageUrl(''); // Reset cropped image
      
      toast({
        title: "Image selected",
        description: `Your image (${formatFileSize(file.size)}) has been selected successfully.`,
      });
    }
  };

  // Handle video file change
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('Selected video file:', file.name, 'Size:', formatFileSize(file.size), 'Type:', file.type);
      
      // Validate file type
      const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/ogg'];
      if (!allowedVideoTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `Please select a supported video file (MP4, MOV, AVI, WebM, OGG). Current type: ${file.type}`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size (50MB limit for vlogs bucket)
      const maxVideoSize = 50 * 1024 * 1024; // 50MB in bytes
      console.log('Video size check:', file.size, 'vs limit:', maxVideoSize, 'Is valid:', file.size <= maxVideoSize);
      
      if (file.size > maxVideoSize) {
        toast({
          title: "File too large",
          description: `Please select a video smaller than 50MB. Current size: ${formatFileSize(file.size)}`,
          variant: "destructive"
        });
        return;
      }

      // Create preview URL and store file
      const previewUrl = URL.createObjectURL(file);
      setPostVideo(previewUrl);
      setPostVideoFile(file);
      
      toast({
        title: "Video selected",
        description: `Your video (${formatFileSize(file.size)}) has been selected successfully.`,
      });
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  };

  const triggerVideoInput = () => {
    const videoInput = document.getElementById('video-input') as HTMLInputElement;
    videoInput?.click();
  };

  const handleAddCompanion = (user: UserProfile) => {
    if (!selectedCompanions.some(c => c.id === user.id)) {
      setSelectedCompanions(prev => [...prev, user]);
      setSearchQuery('');
    }
  };

  const handleRemoveCompanion = (userId: string) => {
    setSelectedCompanions(prev => prev.filter(c => c.id !== userId));
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post.",
        variant: "destructive"
      });
      return;
    }

    // Use cropped image if available, otherwise use original
    const imageToUpload = croppedImageUrl || postImage;
    
    if ((postType === 'photo' || postType === 'trip') && !postImageFile) {
      toast({
        title: "Missing image",
        description: "Please select an image for your post.",
        variant: "destructive"
      });
      return;
    }

    if (postType === 'video' && !postVideoFile) {
      toast({
        title: "Missing video",
        description: "Please select a video for your post.",
        variant: "destructive"
      });
      return;
    }

    if (postType === 'trip') {
      if (!tripTitle || !tripDate || !tripEndDate || !tripDescription || !postLocation) {
        toast({
          title: "Missing information",
          description: "Please fill in all required trip details.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      let postContent = '';
      let imageUrls: string[] = [];
      let videoUrl: string | null = null;
      let tripId: string | null = null;
      let chat_id: string | null = null; // New variable for chat_id

      // Upload image to Supabase storage if present
      if (postImageFile) {
        console.log('Uploading image file:', postImageFile.name, 'Size:', formatFileSize(postImageFile.size));
        
        // If we have a cropped image, convert it to a file
        let fileToUpload = postImageFile;
        if (croppedImageUrl && croppedImageUrl !== postImage) {
          // Convert cropped image URL to file
          const response = await fetch(croppedImageUrl);
          const blob = await response.blob();
          fileToUpload = new File([blob], postImageFile.name, { type: 'image/jpeg' });
        }
        
        const { url, error } = await uploadFile(fileToUpload, {
          bucket: 'posts',
          folder: 'images',
          userId: user.id
        });

        if (error) {
          console.error('Image upload error:', error);
          throw new Error(`Failed to upload image: ${error.message}`);
        }

        if (url) {
          imageUrls = [url];
          console.log('Image uploaded successfully:', url);
        }
      }

      // Upload video to Supabase storage if present
      if (postVideoFile) {
        console.log('Uploading video file:', postVideoFile.name, 'Size:', formatFileSize(postVideoFile.size));
        
        // Double check file size before upload (50MB limit for vlogs bucket)
        const maxVideoSize = 50 * 1024 * 1024; // 50MB
        if (postVideoFile.size > maxVideoSize) {
          throw new Error(`Video file too large: ${formatFileSize(postVideoFile.size)}. Maximum allowed: 50MB`);
        }
        
        const { url, error } = await uploadFile(postVideoFile, {
          bucket: 'posts',
          folder: 'videos',
          userId: user.id
        });

        if (error) {
          console.error('Video upload error:', error);
          throw new Error(`Failed to upload video: ${error.message}`);
        }

        if (url) {
          videoUrl = url;
          console.log('Video uploaded successfully:', url);
        }
      }

      if (postType === 'trip') {
        postContent = `${tripTitle}\n\n${tripDescription}`;
        
        // Handle path creation if needed
        let pathId: string | null = null;
        let pathType = pathSelection?.type || 'none';
        let pathMetadata = pathSelection?.metadata || {};

        if (pathSelection?.type === 'existing' && pathSelection.path) {
          // Use existing path
          pathId = pathSelection.path.id;
          pathMetadata = { sourcePathId: pathSelection.path.id };
        } else if ((pathSelection?.type === 'manual' || pathSelection?.type === 'ai_generated') && pathSelection.waypoints?.length) {
          // Create new path from manual or AI-generated waypoints
          const pathData = {
            title: `${tripTitle} - Travel Path`,
            description: `Custom travel path for ${postLocation}`,
            created_by: user.id,
            is_public: false, // Private by default for trip-created paths
            estimated_duration: tripDate && tripEndDate ? 
              `${Math.ceil((tripEndDate.getTime() - tripDate.getTime()) / (1000 * 60 * 60 * 24))} days` : 
              undefined
          };

          const { data: newPath, error: pathError } = await supabase
            .from('travel_paths')
            .insert(pathData)
            .select()
            .single();

          if (pathError) {
            console.error('Error creating path:', pathError);
            toast({
              title: 'Warning',
              description: 'Trip created but path could not be saved',
              variant: 'destructive'
            });
          } else if (newPath) {
            pathId = newPath.id;

            // Create waypoints
            const waypoints = pathSelection.waypoints.map((stop, index) => ({
              path_id: newPath.id,
              title: stop.name,
              description: stop.description,
              order_index: index + 1,
              estimated_time: stop.estimated_time,
              latitude: stop.latitude,
              longitude: stop.longitude
            }));

            const { error: waypointsError } = await supabase
              .from('path_waypoints')
              .insert(waypoints);

            if (waypointsError) {
              console.error('Error creating waypoints:', waypointsError);
            }
          }
        }
        
        // --- CREATE A NEW TRIP FIRST AND THEN LINK THE POST TO IT ---
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .insert({
            user_id: user.id,
            title: tripTitle,
            destination: postLocation,
            description: tripDescription,
            start_date: tripDate?.toISOString().split('T')[0],
            end_date: tripEndDate?.toISOString().split('T')[0],
            max_participants: tripSpots,
            budget: tripBudget ? Number(tripBudget) : null,
            currency: 'INR', // default or ask user if needed
            image_url: imageUrls.length > 0 ? imageUrls[0] : null,
            privacy_level: "public",
            path_id: pathId
          })
          .select('id')
          .single();

        if (tripError || !tripData) {
          throw new Error(`Failed to create trip. ${tripError?.message || ''}`);
        }
        tripId = tripData.id;

        // Create group chat if requested
        if (createTripGroupChat && selectedCompanions.length > 0) {
          try {
            const groupChat = await GroupChatService.createGroupChat({
              name: `${tripTitle} Trip Chat`,
              description: `Group chat for the trip to ${postLocation}`,
              createdBy: user.id,
              participantIds: selectedCompanions.map(c => c.id),
            });
            chat_id = groupChat.id;
            toast({
              title: "Group Chat Created",
              description: "A group chat has been created for your trip.",
            });
          } catch (groupChatError) {
            console.error("Error creating group chat for trip:", groupChatError);
            toast({
              title: "Group Chat Error",
              description: "Failed to create group chat for the trip.",
              variant: "destructive",
            });
          }
        }

        // Add companions to trip_participants table (creator is auto-added by trigger)
        if (selectedCompanions.length > 0) {
          const participantInserts = selectedCompanions.map(companion => ({
            trip_id: tripId,
            user_id: companion.id,
            role: 'participant',
            status: 'accepted',
          }));

          const { error: tripParticipantError } = await supabase
            .from('trip_participants')
            .upsert(participantInserts, { 
              onConflict: 'trip_id,user_id',
              ignoreDuplicates: false 
            });

          if (tripParticipantError) {
            console.error("Error adding trip participants:", tripParticipantError);
            toast({
              title: "Companion Error",
              description: "Failed to add one or more companions to the trip.",
              variant: "destructive",
            });
          }
        }

      } else if (postType === 'photo') {
        postContent = postCaption;
      } else if (postType === 'video') {
        postContent = postCaption;
        
        // For video posts, also create an entry in the vlogs table
        const { error: vlogError } = await supabase
          .from('vlogs')
          .insert({
            user_id: user.id,
            title: postCaption || 'Untitled Video',
            description: postCaption,
            video_url: videoUrl,
            duration: 120, // We'll use max duration for now
            aspect_ratio: '9:16',
            privacy_level: 'public'
          });

        if (vlogError) {
          console.error('Error creating vlog entry:', vlogError);
        }
      } else if (postType === 'path') {
        if (!selectedPathId) {
          throw new Error('Please select a path to share');
        }
        
        // Use PathService to share the path as a post (this creates the post directly)
        const result = await PathService.sharePathAsPost(selectedPathId, user.id, {
          customMessage: postCaption || undefined,
          makePublic: true
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to share path');
        }
        
        // For path posts, skip the regular post creation since PathService handles it
        console.log('Path shared successfully as post:', result.postId);
      }
      
      // Only create regular posts for non-path and non-trip types, or if a trip was created.
      if (postType !== 'path') {
        console.log('Creating post with data:', {
          user_id: user.id,
          content: postContent,
          location: postLocation,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          video_url: videoUrl,
          privacy_level: 'public',
          trip_id: tripId, // Link to the created trip
          chat_id: chat_id, // Link to the created group chat
        });

        // Insert the post into the database
        const { data, error } = await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            content: postContent,
            location: postLocation,
            image_urls: imageUrls.length > 0 ? imageUrls : null,
            video_url: videoUrl,
            privacy_level: 'public',
            trip_id: tripId, 
            chat_id: chat_id,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating post:', error);
          throw error;
        }

        console.log('Post created successfully:', data);
      }

      if (postType === 'trip') {
        const pathMessage = pathSelection?.type !== 'none' ? 
          ` with ${pathSelection?.type === 'manual' ? 'custom' : 
                   pathSelection?.type === 'ai_generated' ? 'AI-generated' : 
                   'selected'} travel path` : '';
        toast({
          title: "Trip shared!",
          description: `Your trip${pathMessage} has been posted and others can now apply to join.`,
        });
      } else if (postType === 'video') {
        toast({
          title: "Video posted!",
          description: "Your video has been shared.",
        });
      } else {
        toast({
          title: "Post created!",
          description: postType === 'path' ? "Your path has been shared." : "Your photo has been shared.",
        });
      }

      // Add cross-posting logic
      if (crossPostToInstagram) {
        toast({
          title: "Cross-posted to Instagram",
          description: "Your post has been shared on Instagram.",
        });
      }
      
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error creating post",
        description: error instanceof Error ? error.message : "There was an error creating your post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Cross-posting component
  const CrossPostingOptions = () => (
    <div className="space-y-2">
      <Label className="text-base font-medium">Cross-post to:</Label>
      <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-md">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Instagram</p>
            <p className="text-xs text-muted-foreground">Share your post on Instagram</p>
          </div>
        </div>
        <Switch 
          checked={crossPostToInstagram}
          onCheckedChange={setCrossPostToInstagram}
        />
      </div>
    </div>
  );

  const handleCropComplete = (croppedUrl: string) => {
    setCroppedImageUrl(croppedUrl);
  };

  const handleRemoveImage = () => {
    if (postImage) {
      URL.revokeObjectURL(postImage);
    }
    if (croppedImageUrl) {
      URL.revokeObjectURL(croppedImageUrl);
    }
    setPostImage('');
    setCroppedImageUrl('');
    setPostImageFile(null);
    setSelectedAspectRatio(0);
  };

  return (
    <div className="container p-4 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create Post</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        id="video-input"
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/ogg"
        onChange={handleVideoChange}
        className="hidden"
      />
      
      <Tabs defaultValue={postType} onValueChange={(value) => setPostType(value as 'photo' | 'video' | 'path' | 'trip')}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="photo">
            <ImageIcon className="h-4 w-4 mr-2" />
            Photo
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="h-4 w-4 mr-2" />
            Video
          </TabsTrigger>
          <TabsTrigger value="path">
            <Map className="h-4 w-4 mr-2" />
            Path
          </TabsTrigger>
          <TabsTrigger value="trip">
            <Users className="h-4 w-4 mr-2" />
            Trip
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="photo" className="space-y-6">
          <div className="space-y-2">
            <Label>Upload Photo</Label>
            {postImage ? (
              <div className="space-y-4">
                <AspectRatioSelector
                  selectedRatio={selectedAspectRatio}
                  onRatioChange={setSelectedAspectRatio}
                />
                <ImageCropper
                  imageUrl={postImage}
                  aspectRatio={selectedAspectRatio}
                  onCropComplete={handleCropComplete}
                  onRemove={handleRemoveImage}
                />
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-md aspect-[4/5] md:aspect-[3/2] w-full max-w-sm mx-auto flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={triggerFileInput}
              >
                <Camera className="h-12 w-12 mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Click to upload a photo
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG or JPG
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption..."
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Add location..."
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
            />
          </div>
          
          <CrossPostingOptions />
          
          <Button 
            onClick={handleCreatePost} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share'}
          </Button>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <div className="space-y-2">
            <Label>Upload Video</Label>
            <p className="text-sm text-muted-foreground">Maximum 50MB, supported formats: MP4, MOV, AVI, WebM, OGG</p>
            {postVideo ? (
              <div className="relative">
                <AspectRatio ratio={9/16} className="max-w-xs mx-auto">
                  <video 
                    src={postVideo}
                    className="rounded-md object-cover w-full h-full"
                    controls
                    preload="metadata"
                  />
                </AspectRatio>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
                  onClick={() => {
                    URL.revokeObjectURL(postVideo);
                    setPostVideo('');
                    setPostVideoFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-md aspect-[9/16] max-w-xs mx-auto flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={triggerVideoInput}
              >
                <Video className="h-12 w-12 mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-center px-4">
                  Click to upload a video
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 50MB
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-caption">Caption</Label>
            <Textarea
              id="video-caption"
              placeholder="Write a caption..."
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-location">Location</Label>
            <Input
              id="video-location"
              placeholder="Add location..."
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
            />
          </div>
          
          <CrossPostingOptions />
          
          <Button 
            onClick={handleCreatePost} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Video'}
          </Button>
        </TabsContent>
        
        
        <TabsContent value="path" className="space-y-6">
          <PathPostSelector
            onPathSelect={setSelectedPathId}
            selectedPathId={selectedPathId}
          />

          {selectedPathId && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="path-caption">Caption (Optional)</Label>
                <Textarea
                  id="path-caption"
                  placeholder="Add a caption to your path post..."
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              {/* Add CrossPostingOptions before the Share Path button */}
              <CrossPostingOptions />
              
              <Button 
                onClick={handleCreatePost} 
                className="w-full bg-[#95C11F] text-black hover:bg-[#7a9e19]"
                disabled={isLoading}
              >
                {isLoading ? 'Sharing...' : 'Share Path'}
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trip" className="space-y-6">
          <div className="space-y-2">
            <Label>Trip Cover Photo</Label>
            {postImage ? (
              <div className="space-y-4">
                <AspectRatioSelector
                  selectedRatio={selectedAspectRatio}
                  onRatioChange={setSelectedAspectRatio}
                />
                <ImageCropper
                  imageUrl={postImage}
                  aspectRatio={selectedAspectRatio}
                  onCropComplete={handleCropComplete}
                  onRemove={handleRemoveImage}
                />
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-md aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={triggerFileInput}
              >
                <Camera className="h-12 w-12 mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Click to upload a trip cover photo
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-title">Trip Title</Label>
            <Input
              id="trip-title"
              placeholder="Enter a title for your trip"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-location">Location</Label>
            <Input
              id="trip-location"
              placeholder="Where are you going?"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {tripDate ? format(tripDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={tripDate}
                    onSelect={setTripDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {tripEndDate ? format(tripEndDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={tripEndDate}
                    onSelect={setTripEndDate}
                    initialFocus
                    disabled={(date) => 
                      (tripDate ? date < tripDate : false) || 
                      date < new Date()
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-spots">Available Spots</Label>
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setTripSpots(Math.max(1, tripSpots - 1))}
              >
                -
              </Button>
              <span className="w-8 text-center">{tripSpots}</span>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setTripSpots(tripSpots + 1)}
              >
                +
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-budget">Estimated Budget (optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="trip-budget"
                placeholder="Approximate cost per person"
                value={tripBudget}
                onChange={(e) => setTripBudget(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Invite Companions</Label>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Search users by username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {searchingUsers && <p className="text-sm text-muted-foreground">Searching...</p>}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                      onClick={() => handleAddCompanion(user)}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile_image_url} />
                          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>@{user.username}</span>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCompanions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Companions:</Label>
                {selectedCompanions.map((companion) => (
                  <div key={companion.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={companion.profile_image_url} />
                        <AvatarFallback>{companion.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{companion.username}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCompanion(companion.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="createTripGroupChat"
                checked={createTripGroupChat}
                onCheckedChange={(checked) => setCreateTripGroupChat(!!checked)}
              />
              <Label htmlFor="createTripGroupChat" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Create a group chat for this trip
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-description">Trip Description</Label>
            <Textarea
              id="trip-description"
              placeholder="Describe your trip plans, activities, and what kind of people you're looking for..."
              value={tripDescription}
              onChange={(e) => setTripDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Path Selection */}
          <PathSelector
            destination={postLocation}
            onPathSelect={setPathSelection}
            selectedPath={pathSelection}
          />
          
          {/* Add CrossPostingOptions before the Share Trip button */}
          <CrossPostingOptions />
          
          <Button 
            onClick={handleCreatePost} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share Trip'}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatePost;
