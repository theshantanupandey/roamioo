
import React, { useState } from 'react';
import { Instagram } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CrossPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (username: string, password: string) => void;
  service: 'instagram';
}

export function CrossPostingModal({
  isOpen,
  onClose,
  onConnect,
  service
}: CrossPostingModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConnect = async () => {
    setIsLoading(true);
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onConnect(username, password);
    setIsLoading(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {service === 'instagram' && (
              <>
                <div className="p-1 bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-md">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                Connect to Instagram
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Connect your account to automatically share your posts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Instagram username"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            Note: In a real app, this would redirect to Instagram's OAuth flow.
            We would never ask for your password directly.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={!username || !password || isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
