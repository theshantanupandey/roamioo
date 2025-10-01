import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, UserPlus, Search } from 'lucide-react';
import { useUserSearch, UserProfile } from '@/hooks/useUserSearch';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GroupChatCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroupChat: (name: string, description: string, participants: string[]) => void;
}

export const GroupChatCreationModal: React.FC<GroupChatCreationModalProps> = ({
  isOpen, onClose, onCreateGroupChat
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<UserProfile[]>([]);
  const { searchQuery, setSearchQuery, searchResults, loading } = useUserSearch();

  const handleAddParticipant = (user: UserProfile) => {
    if (!selectedParticipants.some(p => p.id === user.id)) {
      setSelectedParticipants(prev => [...prev, user]);
      setSearchQuery(''); // Clear search after adding
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== userId));
  };

  const handleSubmit = () => {
    onCreateGroupChat(groupName, groupDescription, selectedParticipants.map(p => p.id));
    setGroupName('');
    setGroupDescription('');
    setSelectedParticipants([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-4 sm:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Create Group Chat</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground">
            Start a new group conversation with your friends.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-5">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm sm:text-base">Group Name</Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name (e.g., Trip to Bali)"
              className="w-full text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupDescription" className="text-sm sm:text-base">Description (Optional)</Label>
            <Input
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="What's this group about?"
              className="w-full text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchParticipants" className="text-sm sm:text-base">Add Participants</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchParticipants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, first name, or last name"
                className="w-full pl-9 text-sm sm:text-base"
              />
            </div>
            
            {loading && searchQuery.trim() && <p className="text-xs sm:text-sm text-muted-foreground mt-2">Searching...</p>}

            {searchQuery.trim() && searchResults.length > 0 && (
              <ScrollArea className="h-40 w-full rounded-md border">
                <div className="p-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer mb-1 last:mb-0"
                      onClick={() => handleAddParticipant(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profile_image_url} />
                          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-xs sm:text-sm">@{user.username}</p>
                          {user.first_name || user.last_name ? (
                            <p className="text-xs text-muted-foreground">{`${user.first_name || ''} ${user.last_name || ''}`.trim()}</p>
                          ) : null}
                        </div>
                      </div>
                      <UserPlus className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedParticipants.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs sm:text-sm font-medium">Selected Participants:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedParticipants.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-1 bg-secondary text-secondary-foreground rounded-full pl-2 sm:pl-3 pr-1 py-1 text-xs sm:text-sm border"
                    >
                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                        <AvatarImage src={user.profile_image_url} />
                        <AvatarFallback className="text-xs">{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>@{user.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 sm:h-5 sm:w-5 hover:bg-transparent"
                        onClick={() => handleRemoveParticipant(user.id)}
                      >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="mt-4 sm:mt-6">
          <Button variant="outline" onClick={onClose} className="text-sm sm:text-base">Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!groupName.trim() || selectedParticipants.length === 0} className="text-sm sm:text-base">
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
