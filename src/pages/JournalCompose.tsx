import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Book, Send, Globe, Lock, Share2 } from 'lucide-react';
import { crossPostingService } from '@/services/CrossPostingService';

const JournalCompose: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const entryId = searchParams.get('id');
  const isEditing = !!entryId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [publishAsPost, setPublishAsPost] = useState(false);
  const [postToTwitter, setPostToTwitter] = useState(false);
  const [postToThreads, setPostToThreads] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  // Load existing entry if editing
  useEffect(() => {
    if (isEditing && entryId && user) {
      const loadEntry = async () => {
        try {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('id', entryId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;

          if (data) {
            setTitle(data.title);
            setContent(data.content);
            setIsPrivate(data.is_private);
            setPublishAsPost(data.is_posted);
          }
        } catch (error) {
          console.error('Error loading entry:', error);
          toast({ title: 'Error', description: 'Failed to load journal entry', variant: 'destructive' });
          navigate('/journal');
        } finally {
          setLoading(false);
        }
      };
      loadEntry();
    }
  }, [entryId, isEditing, user, navigate, toast]);

  // Basic SEO for this page (title, description, canonical)
  useEffect(() => {
    document.title = isEditing ? 'Edit Journal Entry | Wander' : 'Compose Journal Entry | Wander';

    const desc =
      'Write a new travel journal entry and optionally publish as a post or cross-post to X and Threads.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    (meta as HTMLMetaElement).setAttribute('content', desc);

    const existingCanonical = document.querySelector('link[rel="canonical"]') as
      | HTMLLinkElement
      | null;
    const href = window.location.origin + '/journal/compose';
    if (existingCanonical) {
      existingCanonical.href = href;
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', href);
      document.head.appendChild(link);
    }
  }, []);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ title: 'Not signed in', description: 'Please log in to write a journal entry.' });
      return;
    }
    if (!content.trim()) {
      toast({ title: 'Add some text', description: 'Write something about your journey.' });
      return;
    }

    setSubmitting(true);
    try {
      const computedTitle = title.trim() || content.trim().slice(0, 60);
      const today = new Date();

      if (isEditing && entryId) {
        // Update existing entry
        const { data: entry, error: entryError } = await supabase
          .from('journal_entries')
          .update({
            title: computedTitle,
            content: content.trim(),
            is_private: isPrivate,
            is_posted: publishAsPost,
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId)
          .eq('user_id', user.id)
          .select('*')
          .single();

        if (entryError) throw entryError;

        // Update or create post if publish is toggled on
        if (publishAsPost && entry?.id) {
          const privacy = isPrivate ? 'private' : 'public';
          
          // Check if post exists
          const { data: existingPost } = await supabase
            .from('posts')
            .select('id')
            .eq('journal_entry_id', entry.id)
            .single();

          if (existingPost) {
            // Update existing post - mark as edited
            await supabase
              .from('posts')
              .update({
                content: content.trim(),
                privacy_level: privacy,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPost.id);
          } else {
            // Create new post
            await supabase.from('posts').insert({
              user_id: user.id,
              content: content.trim(),
              privacy_level: privacy,
              journal_entry_id: entry.id,
            });
          }
        }

        toast({
          title: 'Journal updated',
          description: 'Your journal entry has been updated.',
        });
      } else {
        // Create new entry
        const { data: entry, error: entryError } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: computedTitle,
            content: content.trim(),
            entry_date: today.toISOString().slice(0, 10),
            is_private: isPrivate,
            is_posted: publishAsPost,
          })
          .select('*')
          .single();

        if (entryError) throw entryError;

        if (publishAsPost && entry?.id) {
          const privacy = isPrivate ? 'private' : 'public';
          const { error: postError } = await supabase.from('posts').insert({
            user_id: user.id,
            content: content.trim(),
            privacy_level: privacy,
            journal_entry_id: entry.id,
          });
          if (postError) throw postError;
        }

        toast({
          title: 'Journal saved',
          description: publishAsPost ? 'Also published as a post.' : 'Saved to your journal.',
        });
      }

      if (postToTwitter || postToThreads) {
        await crossPostingService.crossPost(
          { caption: content.trim() },
          { twitter: postToTwitter, threads: postToThreads }
        );
      }

      navigate('/journal');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({ title: 'Error', description: 'Failed to save entry', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}</h1>
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Book className="h-4 w-4" />
            Share a moment from your journey
          </div>

          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
          />

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening on your trip?"
            rows={5}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                <span>{isPrivate ? 'Private (only you)' : 'Public'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="privacy" className="text-sm">
                  Privacy
                </Label>
                <Switch id="privacy" checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                <Share2 className="h-4 w-4" />
                <span>Publish as a Post</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="publish" className="text-sm">
                  Publish
                </Label>
                <Switch id="publish" checked={publishAsPost} onCheckedChange={setPublishAsPost} />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border">
            <p className="text-sm font-medium mb-2">Cross-post (optional)</p>
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch id="twitter" checked={postToTwitter} onCheckedChange={setPostToTwitter} />
                <Label htmlFor="twitter" className="text-sm">
                  X (Twitter)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="threads" checked={postToThreads} onCheckedChange={setPostToThreads} />
                <Label htmlFor="threads" className="text-sm">
                  Threads
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cross-posting uses mock connectors. Hook up your APIs later.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/journal')} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isEditing ? (publishAsPost ? 'Update & Publish' : 'Update') : (publishAsPost ? 'Publish' : 'Save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalCompose;
