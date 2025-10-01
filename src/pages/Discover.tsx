
import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Tag, Compass, Globe, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Place {
  id: string;
  name: string;
  description: string;
  category: string; // Matches the database field
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  image_urls: string[];
  average_rating: number;
  total_reviews: number;
  price_range: string;
  website: string;
  phone: string;
  email: string;
  is_verified: boolean;
  opening_hours: any;
  created_at: string;
  created_by: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url?: string;
}

const Discover = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Fetch places from Supabase
  useEffect(() => {
    const fetchPlaces = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .order('average_rating', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Type assertion to match our Place interface
        setPlaces(data as Place[]);
        setFilteredPlaces(data as Place[]);
      } catch (err) {
        console.error('Error fetching places:', err);
        toast({
          title: 'Error loading places',
          description: 'Please try again later',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch current user profile
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (error) {
            throw error;
          }
          
          setUserProfile({
            id: data.id,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email,
            profile_image_url: data.profile_image_url,
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    
    fetchPlaces();
    fetchUserProfile();
  }, [toast]);
  
  useEffect(() => {
    // Filter places based on search query and selected category
    let result = [...places];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        place => place.name.toLowerCase().includes(query) ||
                place.description?.toLowerCase().includes(query) ||
                place.city?.toLowerCase().includes(query) ||
                place.country?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory) {
      result = result.filter(place => place.category === selectedCategory);
    }
    
    setFilteredPlaces(result);
  }, [searchQuery, selectedCategory, places]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
    setShowFilter(false);
  };
  
  const categories = [
    { id: 'restaurant', name: 'Restaurants', icon: <Tag className="h-4 w-4" /> },
    { id: 'attraction', name: 'Attractions', icon: <Compass className="h-4 w-4" /> },
    { id: 'hotel', name: 'Hotels', icon: <Globe className="h-4 w-4" /> },
  ];
  
  const renderPlaceCard = (place: Place) => {
    return (
      <div key={place.id} className="bg-background rounded-lg border overflow-hidden">
        <div className="aspect-video relative overflow-hidden">
          <img 
            src={place.image_urls && place.image_urls.length > 0 
              ? place.image_urls[0] 
              : '/placeholder.svg'}
            alt={place.name}
            className="object-cover w-full h-full"
          />
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400 mr-1" />
            {place.average_rating.toFixed(1)}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold mb-1">{place.name}</h3>
          
          <div className="flex items-center text-muted-foreground text-sm mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="line-clamp-1">
              {[place.city, place.country].filter(Boolean).join(', ')}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {place.description || 'No description available.'}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full">
              {place.category}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7 px-2"
              onClick={() => window.location.href = `/place/${place.id}`}
            >
              View details
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container py-4 px-4 pb-24">
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-heading font-bold">Discover Places</h1>
        </div>
        <p className="text-muted-foreground text-sm">Find interesting places around the world</p>
      </div>
      
      {/* Search and Filter */}
      <div className="sticky top-0 z-10 bg-background pb-4">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 bg-muted/30 rounded-full overflow-hidden border border-input/30">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-transparent border-none h-10 pl-9 pr-4 focus:outline-none focus:ring-0 text-sm"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            className={`rounded-full w-10 h-10 border-input/30 ${showFilter ? 'bg-muted' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        {showFilter && (
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`rounded-full px-4 py-1 text-sm whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'bg-wanderblue hover:bg-wanderblue-dark' 
                    : 'border-input/30'
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                {category.icon}
                <span className="ml-1">{category.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* Places Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-muted animate-pulse rounded-lg h-[300px]" />
          ))}
        </div>
      ) : filteredPlaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map(place => renderPlaceCard(place))}
        </div>
      ) : (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory 
              ? "No places found matching your criteria." 
              : "No places available yet."}
          </p>
          {(searchQuery || selectedCategory) && (
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
            }} className="rounded-full">
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Discover;
