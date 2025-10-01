
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, User, X, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Companion {
  id: string;
  name: string;
  email: string;
  status: 'invited' | 'accepted' | 'declined';
}

interface TripCompanionsProps {
  initialCompanions?: Companion[];
  onAdd?: (companion: Omit<Companion, 'id' | 'status'>) => void;
  onRemove?: (id: string) => void;
}

export function TripCompanions({ 
  initialCompanions = [], 
  onAdd,
  onRemove
}: TripCompanionsProps) {
  const { toast } = useToast();
  const [companions, setCompanions] = useState<Companion[]>(initialCompanions);
  const [newCompanionName, setNewCompanionName] = useState('');
  const [newCompanionEmail, setNewCompanionEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleAddCompanion = () => {
    if (!newCompanionName.trim() || !newCompanionEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email",
        variant: "destructive",
      });
      return;
    }

    const newCompanion: Companion = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCompanionName,
      email: newCompanionEmail,
      status: 'invited'
    };

    setCompanions([...companions, newCompanion]);
    setNewCompanionName('');
    setNewCompanionEmail('');
    setIsInviting(false);

    // Call the onAdd callback if provided
    if (onAdd) {
      onAdd({ name: newCompanionName, email: newCompanionEmail });
    }

    toast({
      title: "Invitation sent",
      description: `${newCompanionName} has been invited to join your trip`,
    });
  };

  const handleRemoveCompanion = (id: string) => {
    setCompanions(companions.filter(companion => companion.id !== id));
    
    // Call the onRemove callback if provided
    if (onRemove) {
      onRemove(id);
    }
  };

  const getStatusBadgeColor = (status: Companion['status']) => {
    switch (status) {
      case 'invited':
        return 'bg-amber-100 text-amber-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <User className="mr-2 h-5 w-5" />
          Trip Companions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {companions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No companions added yet</p>
            <p className="text-sm">Invite friends to join your trip</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {companions.map((companion) => (
              <div key={companion.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-wanderblue text-white text-xs">
                      {companion.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{companion.name}</p>
                    <p className="text-xs text-muted-foreground">{companion.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(companion.status)}`}>
                    {companion.status.charAt(0).toUpperCase() + companion.status.slice(1)}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCompanion(companion.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isInviting ? (
          <div className="space-y-3">
            <div>
              <Input
                placeholder="Friend's name"
                value={newCompanionName}
                onChange={(e) => setNewCompanionName(e.target.value)}
                prefix={<User className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <div>
              <Input
                placeholder="Friend's email"
                value={newCompanionEmail}
                onChange={(e) => setNewCompanionEmail(e.target.value)}
                prefix={<Mail className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCompanion} className="bg-wanderblue hover:bg-wanderblue-dark">
                Send Invitation
              </Button>
              <Button variant="outline" onClick={() => setIsInviting(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsInviting(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite a companion
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
