
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, X, Camera, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PathSelector, PathSelection } from '@/components/PathSelector';
import { useUserSearch, UserProfile } from '@/hooks/useUserSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

export interface TripFormData {
  title: string;
  destination: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  budget: string;
  currency: string;
  maxParticipants: number;
  companions: UserProfile[]; // Changed to UserProfile[]
  imageFile?: File | null;
  imageUrl?: string;
  pathSelection?: PathSelection;
  createGroupChat?: boolean; // New field for group chat
}

interface TripFormProps {
  onSubmit: (data: TripFormData) => void;
  submitButtonText?: string;
  initialData?: Partial<TripFormData>;
  isSubmitting?: boolean;
}

export const TripForm: React.FC<TripFormProps> = ({
  onSubmit,
  submitButtonText = "Create Trip",
  initialData = {},
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<TripFormData>({
    title: initialData.title || '',
    destination: initialData.destination || '',
    description: initialData.description || '',
    startDate: initialData.startDate,
    endDate: initialData.endDate,
    budget: initialData.budget || '',
    currency: initialData.currency || 'INR', // Set INR as default
    maxParticipants: initialData.maxParticipants || 10,
    companions: initialData.companions || [],
    imageFile: initialData.imageFile,
    imageUrl: initialData.imageUrl,
    pathSelection: initialData.pathSelection || { type: 'none' },
    createGroupChat: initialData.createGroupChat || false,
  });

  const { searchQuery, setSearchQuery, searchResults, loading } = useUserSearch();
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.imageUrl || null);

  const handleInputChange = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleInputChange('imageFile', file);
    } else {
      setImagePreview(null);
      handleInputChange('imageFile', null);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    handleInputChange('imageFile', null);
    handleInputChange('imageUrl', '');
  };

  const handleAddCompanion = (user: UserProfile) => {
    if (!formData.companions.some(c => c.id === user.id)) {
      handleInputChange('companions', [...formData.companions, user]);
      setSearchQuery(''); // Clear search after adding
    }
  };

  const handleRemoveCompanion = (userId: string) => {
    handleInputChange('companions', formData.companions.filter(c => c.id !== userId));
  };

  const handlePathSelection = (pathSelection: PathSelection) => {
    setFormData(prev => ({
      ...prev,
      pathSelection
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      return;
    }
    if (!formData.destination.trim()) {
      return;
    }
    if (!formData.startDate) {
      return;
    }
    if (!formData.endDate) {
      return;
    }
    if (formData.startDate >= formData.endDate) {
      return;
    }
    
    onSubmit(formData);
  };

  const currencies = [
    { value: 'INR', label: 'INR (₹)' }, // Added INR as default/first
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Trip Image */}
      <div className="space-y-2">
        <Label>Trip Image</Label>
        {imagePreview ? (
          <div className="relative group">
            <img src={imagePreview} alt="Trip preview" className="w-full h-48 object-cover rounded-md" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className="flex justify-center items-center w-full h-48 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => document.getElementById('trip-image-input')?.click()}
          >
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Click to upload an image</p>
              <p className="text-xs text-gray-500">PNG or JPG</p>
            </div>
          </div>
        )}
        <input
          id="trip-image-input"
          type="file"
          className="hidden"
          accept="image/png, image/jpeg"
          onChange={handleImageChange}
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Trip Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter trip title"
          required
        />
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination">Destination *</Label>
        <div className="flex gap-2">
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => handleInputChange('destination', e.target.value)}
            placeholder="Where are you going?"
            required
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              // Navigate to map with location picker mode
              window.location.href = '/roamio-map?picker=true&field=destination';
            }}
            title="Locate on map"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe your trip..."
          rows={3}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => handleInputChange('startDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>End Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => handleInputChange('endDate', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Budget and Currency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => handleInputChange('budget', e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Max Participants */}
      <div className="space-y-2">
        <Label htmlFor="maxParticipants">Maximum Participants</Label>
        <div className="flex items-center relative w-full">
          <Input
            id="maxParticipants"
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val >= 1 && val <= 100) {
                handleInputChange('maxParticipants', val);
              }
              if (e.target.value === '') {
                handleInputChange('maxParticipants', '');
              }
            }}
            placeholder="10"
            min="1"
            max="100"
            className="pr-20 no-spinner"
            style={{
              MozAppearance: 'textfield',
            }}
          />
          <div className="absolute right-2 flex items-center space-x-2 h-full">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={formData.maxParticipants <= 1}
              onClick={() =>
                handleInputChange(
                  'maxParticipants',
                  Math.max(1, formData.maxParticipants - 1)
                )
              }
              tabIndex={-1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path></svg>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={formData.maxParticipants >= 100}
              onClick={() =>
                handleInputChange(
                  'maxParticipants',
                  Math.min(100, formData.maxParticipants + 1)
                )
              }
              tabIndex={-1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path></svg>
            </Button>
          </div>
        </div>
        <style>{`
          /* Hide number input arrows/spinners for all browsers */
          input[type="number"].no-spinner::-webkit-inner-spin-button, 
          input[type="number"].no-spinner::-webkit-outer-spin-button { 
            -webkit-appearance: none;
            margin: 0; 
          }
          input[type="number"].no-spinner { 
            -moz-appearance: textfield; 
            appearance: textfield;
          }
        `}</style>
      </div>

      {/* Companions */}
      <div className="space-y-4">
        <Label>Invite Companions</Label>
        
        {/* Search and add new companion */}
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Search users by username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          {loading && <p className="text-sm text-muted-foreground">Searching...</p>}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                  onClick={() => handleAddCompanion(user)}
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_image_url} />
                      <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>@{user.username}</span>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Companions list */}
        {formData.companions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Selected Companions:</Label>
            {formData.companions.map((companion) => (
              <div key={companion.id} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={companion.profile_image_url} />
                    <AvatarFallback>{companion.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">@{companion.username}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCompanion(companion.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Create Group Chat Checkbox */}
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="createGroupChat"
            checked={formData.createGroupChat}
            onCheckedChange={(checked) => handleInputChange('createGroupChat', checked)}
          />
          <Label htmlFor="createGroupChat" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Create a group chat for this trip
          </Label>
        </div>
      </div>

      {/* Path Selection */}
      <PathSelector
        destination={formData.destination}
        onPathSelect={handlePathSelection}
        selectedPath={formData.pathSelection}
      />

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : submitButtonText}
      </Button>
    </form>
  );
};
