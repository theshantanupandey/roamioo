import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Languages, Mic, Volume2, Loader2, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi'
};

const TranslationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access translations",
        variant: "destructive"
      });
      navigate('/login', { state: { returnUrl: '/translation' } });
    }
  }, [user, toast, navigate]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to translate",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: {
          text: sourceText,
          sourceLanguage,
          targetLanguage
        }
      });

      if (error) throw error;

      setTranslatedText(data.translatedText);

      // Save translation
      if (user) {
        await supabase.from('translations').insert({
          user_id: user.id,
          source_text: sourceText,
          translated_text: data.translatedText,
          source_language: sourceLanguage,
          target_language: targetLanguage
        });
      }

      toast({
        title: "Translation complete",
        description: "Text translated successfully"
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Error",
        description: "Failed to translate text",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio }
            });

            if (error) throw error;

            setSourceText(data.text);
            toast({
              title: "Speech recognized",
              description: "Your speech has been converted to text"
            });
          } catch (error) {
            console.error('Speech-to-text error:', error);
            toast({
              title: "Error",
              description: "Failed to convert speech to text",
              variant: "destructive"
            });
          }
        };

        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording...",
        description: "Speak now. Click again to stop."
      });
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const handleTextToSpeech = async () => {
    if (!translatedText) {
      toast({
        title: "No translation",
        description: "Translate text first to hear it",
        variant: "destructive"
      });
      return;
    }

    setIsSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: {
          text: translatedText,
          voice: 'alloy'
        }
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive"
      });
      setIsSpeaking(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto pb-24 px-4">
      <PageHeader 
        heading="Translation" 
        subheading="Translate text and speak it aloud"
        icon={<Languages className="h-6 w-6" />}
      />

      <div className="mt-6 space-y-6">
        {/* Language Selection */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">From</label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwapLanguages}
                className="mt-6"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">To</label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Section */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Enter Text</label>
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={handleVoiceInput}
              >
                <Mic className={cn("h-4 w-4 mr-1", isRecording && "animate-pulse")} />
                {isRecording ? "Stop" : "Voice Input"}
              </Button>
            </div>
            
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type or speak to translate..."
              className="min-h-[120px] resize-none"
            />

            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="w-full"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-4 w-4 mr-2" />
                  Translate
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Section */}
        {translatedText && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Translation</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTextToSpeech}
                  disabled={isSpeaking}
                >
                  <Volume2 className={cn("h-4 w-4 mr-1", isSpeaking && "animate-pulse")} />
                  {isSpeaking ? "Playing..." : "Listen"}
                </Button>
              </div>
              
              <div className="p-4 bg-muted rounded-lg min-h-[120px]">
                <p className="text-sm">{translatedText}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TranslationPage;
