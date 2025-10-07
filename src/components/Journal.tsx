
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SwipeableJournalCard } from './SwipeableJournalCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
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
    navigate(`/journal/compose?id=${entryId}`);
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryToDelete);

      if (error) throw error;

      setEntries(entries.filter(e => e.id !== entryToDelete));
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
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
        <>
          {entries.map((entry) => (
            <SwipeableJournalCard
              key={entry.id}
              entry={entry}
              onEdit={handleViewEntry}
              onDelete={handleDeleteEntry}
              getMoodEmoji={getMoodEmoji}
              getWeatherEmoji={getWeatherEmoji}
            />
          ))}
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this journal entry? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default Journal;
