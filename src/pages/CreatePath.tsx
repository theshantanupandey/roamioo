import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MapPin, X, Plus, Camera, Store, Utensils, Route, Calendar, Clock, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreatePath = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const [pathTitle, setPathTitle] = useState('');
  const [pathDescription, setPathDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [stops, setStops] = useState<{
    id: string;
    type: 'accommodation' | 'food' | 'attraction' | 'transport' | 'shopping';
    name: string;
    location: string;
    description: string;
    image: string;
    day: number;
    estimated_time?: string;
    latitude?: number;
    longitude?: number;
  }[]>([]);

  // Handle file upload from device
  const handleFileUpload = (file: File, setImageFn: React.Dispatch<React.SetStateAction<string>>) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageFn(e.target.result as string);
        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded successfully.",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle file change (from device upload)
  const handleFileChange = (setImageFn: React.Dispatch<React.SetStateAction<string>>) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        handleFileUpload(file, setImageFn);
      }
    };
    input.click();
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, setImageFn: React.Dispatch<React.SetStateAction<string>>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file, setImageFn);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addStop = () => {
    const newStop = {
      id: `stop-${Date.now()}`,
      type: 'attraction' as const,
      name: '',
      location: '',
      description: '',
      image: '',
      day: stops.length > 0 ? stops[stops.length - 1].day : 1
    };
    setStops([...stops, newStop]);
  };

  const updateStop = (id: string, field: string, value: any) => {
    setStops(stops.map(stop => 
      stop.id === id ? { ...stop, [field]: value } : stop
    ));
  };

  const removeStop = (id: string) => {
    setStops(stops.filter(stop => stop.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pathTitle || !destination || !duration || !coverImage) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (stops.length === 0) {
      toast({
        title: "No stops added",
        description: "Please add at least one stop to your path",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Path created!",
      description: "Your path has been created and shared to your feed.",
    });
    navigate('/feed');
  };

  const getStopIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return <MapPin className="h-5 w-5" />;
      case 'food': return <Utensils className="h-5 w-5" />;
      case 'attraction': return <Camera className="h-5 w-5" />;
      case 'transport': return <Route className="h-5 w-5" />;
      case 'shopping': return <Store className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };

  return (
    <div className="container p-4 pb-28">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Path</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Path Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverImage ? (
              <div className="relative">
                <AspectRatio ratio={16/9}>
                  <img 
                    src={coverImage}
                    alt="Cover preview"
                    className="rounded-md object-cover w-full h-full"
                  />
                </AspectRatio>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
                  type="button"
                  onClick={() => setCoverImage('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors hover:border-[#95C11F]"
                onClick={() => handleFileChange(setCoverImage)}
                onDrop={(e) => handleDrop(e, setCoverImage)}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Path Title</Label>
            <Input 
              id="title"
              placeholder="My Amazing Journey"
              value={pathTitle}
              onChange={(e) => setPathTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="destination">Destination</Label>
            <Input 
              id="destination"
              placeholder="Paris, France"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <div className="flex">
                <Input 
                  id="duration"
                  placeholder="7"
                  type="number"
                  min="1"
                  className="rounded-r-none"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
                <div className="bg-muted border border-l-0 border-input px-3 flex items-center rounded-r-md text-sm">
                  days
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Share what makes this journey special..."
              className="min-h-[100px]"
              value={pathDescription}
              onChange={(e) => setPathDescription(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex">
              <Input 
                id="tags"
                placeholder="adventure, culture, food"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="rounded-r-none"
              />
              <Button 
                type="button" 
                onClick={addTag}
                className="rounded-l-none"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="pr-1 flex items-center gap-1">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator />
        
        {/* Path Stops */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Path Stops</h2>
            <Button
              type="button"
              onClick={addStop}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Stop
            </Button>
          </div>
          
          {stops.length === 0 ? (
            <div className="border-2 border-dashed rounded-md p-8 text-center">
              <p className="text-muted-foreground">No stops added yet. Click the "Add Stop" button to start building your path.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {stops.map((stop, index) => (
                <Card key={stop.id} className="p-4 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => removeStop(stop.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex items-center justify-center bg-purple-100 text-purple-800 h-7 w-7 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <h3 className="font-medium">Stop {index + 1}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label>Stop Type</Label>
                      <Select
                        value={stop.type}
                        onValueChange={(value: any) => updateStop(stop.id, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accommodation">Accommodation</SelectItem>
                          <SelectItem value="food">Restaurant/Food</SelectItem>
                          <SelectItem value="attraction">Attraction</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="shopping">Shopping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Day</Label>
                      <Select
                        value={stop.day.toString()}
                        onValueChange={(value) => updateStop(stop.id, 'day', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(parseInt(duration) || 1)].map((_, i) => (
                            <SelectItem key={i+1} value={(i+1).toString()}>
                              Day {i+1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Stop Image</Label>
                      {stop.image ? (
                        <div className="relative">
                          <AspectRatio ratio={16/9}>
                            <img 
                              src={stop.image}
                              alt="Stop preview"
                              className="rounded-md object-cover w-full h-full"
                            />
                          </AspectRatio>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-90"
                            type="button"
                            onClick={() => updateStop(stop.id, 'image', '')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors hover:border-[#95C11F]"
                          onClick={() => handleFileChange((img) => updateStop(stop.id, 'image', img))}
                          onDrop={(e) => handleDrop(e, (img) => updateStop(stop.id, 'image', img))}
                          onDragOver={handleDragOver}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium">Click to upload or drag and drop</p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Stop name"
                        value={stop.name}
                        onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="Location details"
                        value={stop.location}
                        onChange={(e) => updateStop(stop.id, 'location', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe this stop..."
                        value={stop.description}
                        onChange={(e) => updateStop(stop.id, 'description', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estimated Time</Label>
                      <Input
                        placeholder="e.g., 2 hours"
                        value={stop.estimated_time || ''}
                        onChange={(e) => updateStop(stop.id, 'estimated_time', e.target.value)}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="pt-4">
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
            Create & Share Path
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePath;
