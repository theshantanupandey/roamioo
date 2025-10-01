
import React from 'react';
import { Instagram, Share2, Settings } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CrossPostingSettingsProps {
  instagramConnected: boolean;
  onToggleInstagram: (connected: boolean) => void;
  onManageConnections: () => void;
}

export function CrossPostingSettings({
  instagramConnected,
  onToggleInstagram,
  onManageConnections
}: CrossPostingSettingsProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-semibold">Cross-Posting</h2>
          <Share2 className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <p className="text-sm text-muted-foreground">
          Connect social media accounts to automatically share your posts.
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-3">
              <div className="p-1 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-md">
                <Instagram className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Instagram</p>
                <p className="text-xs text-muted-foreground">
                  {instagramConnected 
                    ? "Connected and ready to post" 
                    : "Connect to share your posts"}
                </p>
              </div>
            </div>
            <Switch 
              checked={instagramConnected}
              onCheckedChange={onToggleInstagram}
            />
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={onManageConnections}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Connections
        </Button>
      </CardContent>
    </Card>
  );
}
