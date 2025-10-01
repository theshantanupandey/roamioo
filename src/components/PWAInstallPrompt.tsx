
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download, Share } from 'lucide-react';
import { useNative } from '@/hooks/use-native';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const { isNative } = useNative();

  useEffect(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Don't show prompt if already in native app or standalone mode
    if (isNative || standalone) return;

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show prompt after some time if not already dismissed
    if (iOS && !localStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isNative]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android installation
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt || isStandalone || isNative) {
    return null;
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 p-4 bg-background border shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg bg-[#95C11F] flex items-center justify-center">
            <img 
              src="/favicon.ico" 
              alt="Roamio" 
              className="w-8 h-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Install Roamio</h3>
            <p className="text-xs text-muted-foreground">
              {isIOS 
                ? 'Add to Home Screen for the best experience'
                : 'Install for quick access and offline use'
              }
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-3 flex space-x-2">
        {isIOS ? (
          <div className="flex items-center text-xs text-muted-foreground">
            <Share className="h-4 w-4 mr-1" />
            Tap <strong className="mx-1">Share</strong> then <strong className="ml-1">"Add to Home Screen"</strong>
          </div>
        ) : (
          <Button onClick={handleInstallClick} size="sm" className="bg-[#95C11F] hover:bg-[#7a9e19]">
            <Download className="h-4 w-4 mr-1" />
            Install
          </Button>
        )}
      </div>
    </Card>
  );
}
