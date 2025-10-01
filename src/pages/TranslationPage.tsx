// This file was made by Shantanu Pandey
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import Translation, { TranslationHistory } from '@/components/Translation';
import VoiceTranslation from '@/components/VoiceTranslation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const TranslationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [translations, setTranslations] = useState<TranslationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
    <div className="container mx-auto p-4 max-w-3xl">
      <PageHeader 
        heading="Translation" 
        subheading="Translate between multiple languages with voice input and output"
        icon={<Languages className="h-6 w-6 text-indigo-500" />}
      />
      
      <div className="mt-6">
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Voice Translation
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Text Translation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice">
            <VoiceTranslation onTranslationSaved={handleTranslationSaved} />
          </TabsContent>
          
          <TabsContent value="text">
            <Translation translations={translations} isLoading={isLoading} onTranslationSaved={handleTranslationSaved} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TranslationPage;
