// This file was made by Shantanu Pandey
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import Translation, { TranslationHistory } from '@/components/Translation';
import VoiceTranslation from '@/components/VoiceTranslation';
import { Button } from '@/components/ui/button';
import { Languages, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const TranslationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [translations, setTranslations] = useState<TranslationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>('voice');
  
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access translations",
        variant: "destructive"
      });
      navigate('/login', { state: { returnUrl: '/translation' } });
      return;
    }

    fetchTranslations();
  }, [user, toast, navigate]);

  const fetchTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setTranslations(data || []);
    } catch (error) {
      console.error("Error fetching translations:", error);
      toast({
        title: "Error",
        description: "Failed to load translation history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslationSaved = (newTranslation: any) => {
    // Add the new translation to the list
    const translationWithId = {
      ...newTranslation,
      id: Date.now().toString(),
      user_id: user.id,
      created_at: new Date().toISOString()
    };
    setTranslations(prev => [translationWithId, ...prev]);
  };
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto pb-32 px-0">
      <div className="px-4 pt-4">
        <PageHeader 
          heading="Translation" 
          subheading="Translate on-the-go with voice or text"
          icon={<Languages className="h-6 w-6 text-indigo-500" />}
        />
      </div>
      
      {/* Mobile-optimized mode switcher - Fixed at bottom for thumb access */}
      <div className="fixed bottom-20 left-0 right-0 z-10 px-4 pb-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          <Button
            variant={activeMode === 'voice' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setActiveMode('voice')}
            className={cn(
              "h-16 text-base font-medium rounded-2xl shadow-lg transition-all",
              activeMode === 'voice' && "shadow-primary/50"
            )}
          >
            <Mic className="h-5 w-5 mr-2" />
            Voice
          </Button>
          <Button
            variant={activeMode === 'text' ? 'default' : 'outline'}
            size="lg"
            onClick={() => setActiveMode('text')}
            className={cn(
              "h-16 text-base font-medium rounded-2xl shadow-lg transition-all",
              activeMode === 'text' && "shadow-primary/50"
            )}
          >
            <Languages className="h-5 w-5 mr-2" />
            Text
          </Button>
        </div>
      </div>
      
      {/* Translation Content */}
      <div className="mt-4 px-4">
        {activeMode === 'voice' ? (
          <VoiceTranslation onTranslationSaved={handleTranslationSaved} />
        ) : (
          <Translation translations={translations} isLoading={isLoading} onTranslationSaved={handleTranslationSaved} />
        )}
      </div>
    </div>
  );
};

export default TranslationPage;
