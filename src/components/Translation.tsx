import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Globe, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Define the languages available for translation
const LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ru': 'Russian'
};

export interface TranslationHistory {
  id: string;
  user_id: string;
  source_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  created_at: string;
}

interface TranslationProps {
  translations: TranslationHistory[];
  isLoading: boolean;
  onTranslationSaved?: (translation: any) => void;
}

const Translation: React.FC<TranslationProps> = ({ translations, isLoading, onTranslationSaved }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Empty text",
        description: "Please enter text to translate",
        variant: "destructive"
      });
      return;
    }
    
    if (sourceLanguage === targetLanguage) {
      toast({
        title: "Same language selected",
        description: "Source and target languages must be different",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);
    
    try {
      const { data, error: translateError } = await supabase.functions.invoke('translate-text', {
        body: {
          text: sourceText,
          sourceLanguage,
          targetLanguage,
        }
      });

      if (translateError) throw translateError;
      
      const newTranslatedText = data.translatedText;
      if (!newTranslatedText) throw new Error("Translation result was empty.");
      
      setTranslatedText(newTranslatedText);
      
      // Save translation to database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('translations')
          .insert({
            user_id: user.id,
            source_text: sourceText,
            translated_text: newTranslatedText,
            source_language: sourceLanguage,
            target_language: targetLanguage
          });
          
        if (error) throw error;
        
        if (onTranslationSaved) {
          onTranslationSaved({
            source_text: sourceText,
            translated_text: newTranslatedText,
            source_language: sourceLanguage,
            target_language: targetLanguage
          });
        }
      }
      
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation failed",
        description: `Could not complete translation. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Swap source and target languages
  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    // Clear texts when languages are swapped
    setSourceText('');
    setTranslatedText('');
  };
  
  return (
    <Tabs defaultValue="translate" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="translate">Translate</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="translate">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Select
                value={sourceLanguage}
                onValueChange={setSourceLanguage}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="ghost" 
                className="rounded-full"
                onClick={handleSwapLanguages}
              >
                <ChevronRight className="h-5 w-5 rotate-90" />
              </Button>
              
              <Select
                value={targetLanguage}
                onValueChange={setTargetLanguage}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Target" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Textarea 
                placeholder="Enter text to translate"
                className="min-h-[100px] resize-none"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full bg-indigo-500 hover:bg-indigo-600" 
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
            >
              {isTranslating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Translating...
                </span>
              ) : (
                <span className="flex items-center">
                  <Languages className="mr-2 h-4 w-4" />
                  Translate
                </span>
              )}
            </Button>
            
            {translatedText && (
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium">Translation</label>
                <div className="bg-muted p-3 rounded-md min-h-[100px]">
                  {translatedText}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="history">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : translations.length > 0 ? (
          <div className="space-y-4">
            {translations.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">
                    {LANGUAGES[item.source_language]} → {LANGUAGES[item.target_language]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Original Text:</h3>
                  <p className="text-gray-800 mt-1">{item.source_text}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Translation:</h3>
                  <p className="text-gray-800 mt-1">{item.translated_text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="text-gray-400 mb-4">
              <Globe className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">No translations yet</h3>
            <p className="text-gray-500 mt-1">Your translation history will appear here</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default Translation;
