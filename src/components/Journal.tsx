
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, ChevronRight, Plus, Edit3, Eye, Heart, MessageCircle, Bookmark, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

interface JournalProps {
  maxEntries?: number;
  showAllControls?: boolean;
}

const Journal: React.FC<JournalProps> = ({ maxEntries, showAllControls = true }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user, maxEntries]);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (maxEntries) {
        query = query.limit(maxEntries);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = () => {
    navigate('/journal/compose');
  };

  const handleViewEntry = (entryId: string) => {
    // Navigate to journal page - individual entry view not implemented yet
    navigate('/journal');
  };

  const getMoodEmoji = (mood?: string) => {
    const moodMap: { [key: string]: string } = {
      happy: '😊',
      excited: '🤩',
      content: '😌',
      relaxed: '😎',
      nostalgic: '🥺',
      grateful: '🙏',
      adventurous: '🚀',
      peaceful: '☮️'
    };
    return mood ? moodMap[mood] || '😊' : '';
  };

  const getWeatherEmoji = (weather?: string) => {
    const weatherMap: { [key: string]: string } = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      snowy: '❄️',
      windy: '💨',
      foggy: '🌫️'
    };
    return weather ? weatherMap[weather] || '🌤️' : '';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-24 bg-muted rounded-lg" />
        <div className="h-24 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <div className="text-center py-8 border-dashed border-2 rounded-lg">
          <Book className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">Start documenting your adventures</p>
          <Button 
            size="sm" 
            onClick={handleCreateEntry}
            className="bg-[#95C11F] text-black hover:bg-[#7a9e19]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create First Entry
          </Button>
        </div>
      ) : (
        entries.map((entry) => (
          <Card 
            key={entry.id} 
            className="border-l-4 border-l-[#95C11F] hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleViewEntry(entry.id)}
          >
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
        ))
      )}
    </div>
  );
};

export default Journal;
