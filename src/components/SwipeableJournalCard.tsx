import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar, Heart, MessageCircle, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  entry_date: string;
  location?: string;
  mood?: string;
  weather?: string;
  image_urls?: string[];
  is_private: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface SwipeableJournalCardProps {
  entry: JournalEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  getMoodEmoji: (mood?: string) => string;
  getWeatherEmoji: (weather?: string) => string;
}

export const SwipeableJournalCard: React.FC<SwipeableJournalCardProps> = ({
  entry,
  onEdit,
  onDelete,
  getMoodEmoji,
  getWeatherEmoji
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit swipe distance
    const maxSwipe = 120;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(limitedDiff);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Snap to action or reset
    if (swipeOffset > 60) {
      setSwipeOffset(120); // Show edit
    } else if (swipeOffset < -60) {
      setSwipeOffset(-120); // Show delete
    } else {
      setSwipeOffset(0); // Reset
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    currentX.current = e.clientX;
    const diff = currentX.current - startX.current;
    
    const maxSwipe = 120;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(limitedDiff);
  };

  const handleMouseUp = () => {
    setIsSwiping(false);
    
    if (swipeOffset > 60) {
      setSwipeOffset(120);
    } else if (swipeOffset < -60) {
      setSwipeOffset(-120);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if not swiping and not clicking action buttons
    if (Math.abs(swipeOffset) < 10) {
      navigate(`/journal/compose?id=${entry.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(entry.id);
    setSwipeOffset(0);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(entry.id);
    setSwipeOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Edit Button - Left Side */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 flex items-center justify-center bg-blue-500 transition-all",
          swipeOffset > 0 ? "w-[120px]" : "w-0"
        )}
      >
        <button
          onClick={handleEdit}
          className="text-white p-4 flex flex-col items-center justify-center h-full w-full"
        >
          <Edit3 className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Edit</span>
        </button>
      </div>

      {/* Delete Button - Right Side */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 flex items-center justify-center bg-destructive transition-all",
          swipeOffset < 0 ? "w-[120px]" : "w-0"
        )}
      >
        <button
          onClick={handleDelete}
          className="text-white p-4 flex flex-col items-center justify-center h-full w-full"
        >
          <Trash2 className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {/* Card Content */}
      <div
        ref={cardRef}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isSwiping) {
            handleMouseUp();
          }
        }}
        onClick={handleCardClick}
        className="cursor-pointer"
      >
        <Card className="border-l-4 border-l-primary hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm line-clamp-1">{entry.title}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getMoodEmoji(entry.mood)}
                {getWeatherEmoji(entry.weather)}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {entry.content}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(entry.entry_date), 'MMM dd, yyyy')}
                {entry.location && (
                  <>
                    <span>•</span>
                    <span className="line-clamp-1">{entry.location}</span>
                  </>
                )}
              </div>
              
              {!entry.is_private && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {entry.likes_count || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {entry.comments_count || 0}
                  </div>
                </div>
              )}
            </div>
            
            {entry.image_urls && entry.image_urls.length > 0 && (
              <div className="mt-2 flex gap-1">
                {entry.image_urls.slice(0, 3).map((url, index) => (
                  <div key={index} className="w-12 h-12 rounded overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Entry ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {entry.image_urls.length > 3 && (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs">
                    +{entry.image_urls.length - 3}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
