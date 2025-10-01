
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoPost {
  id: string;
  user_id: string;
  content: string;
  video_url: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  users?: {
    username: string;
    profile_image_url?: string;
  };
}

const Video = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<{[key: string]: boolean}>({});
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    const observerOptions = {
      threshold: 0.5,
      root: null,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const videoId = entry.target.getAttribute('data-video-id');
        const videoElement = entry.target.querySelector('video') as HTMLVideoElement;
        
        if (entry.isIntersecting && videoElement && videoId) {
          // Pause all other videos
          videos.forEach(video => {
            if (video.id !== videoId) {
              const otherVideo = document.getElementById(`video-${video.id}`) as HTMLVideoElement;
              if (otherVideo) {
                otherVideo.pause();
              }
            }
          });
          
          // Play current video
          videoElement.play().catch(console.error);
          setPlayingVideo(videoId);
          setCurrentVideoIndex(videos.findIndex(v => v.id === videoId));
        } else if (!entry.isIntersecting && videoElement) {
          // Pause video when out of view
          videoElement.pause();
          if (playingVideo === videoId) {
            setPlayingVideo(null);
          }
        }
      });
    }, observerOptions);

    // Observe all video containers
    const videoContainers = document.querySelectorAll('[data-video-id]');
    videoContainers.forEach(container => observer.observe(container));

    return () => {
      observer.disconnect();
    };
  }, [videos, playingVideo]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          video_url,
          location,
          likes_count,
          comments_count,
          created_at,
          users (
            username,
            profile_image_url
          )
        `)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        toast({
          title: "Error loading videos",
          description: "There was an error loading the videos.",
          variant: "destructive"
        });
        return;
      }

      setVideos(data || []);
      
      // Initialize all videos as muted for autoplay
      const initialMutedState: {[key: string]: boolean} = {};
      data?.forEach(video => {
        initialMutedState[video.id] = true;
      });
      setMutedVideos(initialMutedState);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error loading videos",
        description: "There was an error loading the videos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoPlay = (videoId: string) => {
    const videoElement = document.getElementById(`video-${videoId}`) as HTMLVideoElement;
    if (videoElement) {
      if (playingVideo === videoId) {
        videoElement.pause();
        setPlayingVideo(null);
      } else {
        // Pause all other videos
        videos.forEach(video => {
          const otherVideo = document.getElementById(`video-${video.id}`) as HTMLVideoElement;
          if (otherVideo && otherVideo !== videoElement) {
            otherVideo.pause();
          }
        });
        
        videoElement.play();
        setPlayingVideo(videoId);
      }
    }
  };

  const toggleMute = (videoId: string) => {
    const videoElement = document.getElementById(`video-${videoId}`) as HTMLVideoElement;
    if (videoElement) {
      const newMutedState = !mutedVideos[videoId];
      videoElement.muted = newMutedState;
      setMutedVideos(prev => ({
        ...prev,
        [videoId]: newMutedState
      }));
    }
  };

  const handleLike = async (videoId: string) => {
    // Implement like functionality
    toast({
      title: "Like feature",
      description: "Like functionality will be implemented soon.",
    });
  };

  if (loading) {
    return (
      <div className="container p-4 pb-28">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="container p-4 pb-28">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No videos yet</h2>
            <p className="text-muted-foreground">Be the first to share a video!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-0 pb-28">
      <div className="space-y-0">
        {videos.map((video, index) => (
          <div key={video.id} className="relative h-screen flex" data-video-id={video.id}>
            {/* Video Container */}
            <div className="relative flex-1 bg-black">
              <AspectRatio ratio={9/16} className="h-full">
                <video
                  id={`video-${video.id}`}
                  src={video.video_url}
                  className="w-full h-full object-cover"
                  loop
                  muted={mutedVideos[video.id]}
                  playsInline
                  onEnded={() => setPlayingVideo(null)}
                />
              </AspectRatio>
              
              {/* Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                {playingVideo !== video.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/20 hover:bg-black/40 text-white rounded-full h-16 w-16"
                    onClick={() => toggleVideoPlay(video.id)}
                  >
                    <Play className="h-8 w-8 ml-1" />
                  </Button>
                )}
              </div>

              {/* Video overlay on tap for pause */}
              {playingVideo === video.id && (
                <div 
                  className="absolute inset-0 z-10"
                  onClick={() => toggleVideoPlay(video.id)}
                />
              )}
            </div>

            {/* Right sidebar with actions */}
            <div className="absolute right-4 bottom-20 z-20 flex flex-col space-y-4">
              {/* User Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-300 border-2 border-white overflow-hidden">
                {video.users?.profile_image_url ? (
                  <img 
                    src={video.users.profile_image_url} 
                    alt={video.users.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {video.users?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Like Button */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                  onClick={() => handleLike(video.id)}
                >
                  <Heart className="h-6 w-6" />
                </Button>
                <span className="text-white text-xs mt-1">{video.likes_count}</span>
              </div>

              {/* Comment Button */}
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                >
                  <MessageCircle className="h-6 w-6" />
                </Button>
                <span className="text-white text-xs mt-1">{video.comments_count}</span>
              </div>

              {/* Share Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-12 w-12"
              >
                <Share2 className="h-6 w-6" />
              </Button>

              {/* Mute/Unmute Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={() => toggleMute(video.id)}
              >
                {mutedVideos[video.id] ? (
                  <VolumeX className="h-6 w-6" />
                ) : (
                  <Volume2 className="h-6 w-6" />
                )}
              </Button>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-20 left-4 right-20 z-20 text-white">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">@{video.users?.username || 'user'}</span>
                </div>
                
                {video.content && (
                  <p className="text-sm leading-relaxed">{video.content}</p>
                )}
                
                {video.location && (
                  <p className="text-xs opacity-80">📍 {video.location}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Video;
