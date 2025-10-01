import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Volume2, VolumeX, Play, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

interface VoiceTranslationProps {
  onTranslationSaved?: (translation: any) => void;
}

export const VoiceTranslation: React.FC<VoiceTranslationProps> = ({ onTranslationSaved }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    audioRef.current = new Audio();
    audioRef.current.onended = () => setIsPlaying(false);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak now to record your message"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Processing your speech..."
      });
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });
      
      if (error) throw error;
      
      if (data?.text) {
        setSourceText(data.text);
        toast({
          title: "Speech recognized",
          description: "Text has been transcribed successfully"
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Could not convert speech to text",
        variant: "destructive"
      });
    }
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Empty text",
        description: "Please enter text or record audio to translate",
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
      
      // Generate audio for translated text if audio is enabled
      if (audioEnabled) {
        await generateAudio(newTranslatedText);
      }
      
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

  const generateAudio = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: { 
          text: text,
          voice: 'alloy' // Default voice
        }
      });
      
      if (error) throw error;
      
      if (data?.audioContent) {
        // Convert base64 to audio URL
        const audioBlob = new Blob(
          [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
          { type: 'audio/mp3' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
        
        toast({
          title: "Audio ready",
          description: "Click play to hear the translation"
        });
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: "Audio generation failed",
        description: "Could not generate audio for translation",
        variant: "destructive"
      });
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    
    // Swap texts as well
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Language Selection */}
        <div className="flex items-center justify-between">
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
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
            ⇄
          </Button>
          
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
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

        {/* Audio Controls */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant={audioEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              Audio
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranslating}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Stop' : 'Record'}
            </Button>
          </div>
        </div>
        
        {/* Source Text Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Source Text ({LANGUAGES[sourceLanguage]})</label>
            {isRecording && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording...
              </div>
            )}
          </div>
          <Textarea 
            placeholder="Enter text to translate or use voice recording"
            className="min-h-[100px] resize-none"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
          />
        </div>
        
        {/* Translate Button */}
        <Button 
          className="w-full bg-indigo-500 hover:bg-indigo-600" 
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim() || isRecording}
        >
          {isTranslating ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Translating...
            </span>
          ) : (
            'Translate'
          )}
        </Button>
        
        {/* Translation Output */}
        {translatedText && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Translation ({LANGUAGES[targetLanguage]})</label>
              {audioEnabled && audioRef.current?.src && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlaying ? stopAudio : playAudio}
                >
                  {isPlaying ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isPlaying ? 'Stop' : 'Play'}
                </Button>
              )}
            </div>
            <div className="bg-muted p-3 rounded-md min-h-[100px]">
              {translatedText}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceTranslation;
