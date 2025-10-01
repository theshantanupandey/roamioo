import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  MapPin,
  Search,
  Store,
  Coffee,
  Hotel,
  Utensils,
  Mountain,
  Star,
  Loader2,
  CircleAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import PlaceDetails from '@/components/PlaceDetails';
import { useNearbyPlaces, Place as SupabasePlace } from '@/hooks/usePlaces';  // Renamed import to avoid conflict
import { nearbyPlacesData } from '@/data/nearbyPlacesData';

// Default latitude and longitude (Chandigarh as fallback)
const DEFAULT_LAT = 30.7333;
const DEFAULT_LNG = 76.7794;

// Define a type that matches what PlaceDetails expects
interface PlaceDetailsType {
  id: string;
  name: string;
  type: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  image: string;
  distance?: string;
  lat?: number;
  lng?: number;
  description?: string;
  phone?: string;
  website?: string;
  hours?: string;
  reviews?: any[];
}

export default function NearbyPlaces() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailsType | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Fetch user location on component mount
  useEffect(() => {
    const getUserLocation = () => {
      setIsLoadingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setIsLoadingLocation(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            // Use default location
            setUserLocation({
              lat: DEFAULT_LAT,
              lng: DEFAULT_LNG
            });
            setIsLoadingLocation(false);
          },
          { timeout: 10000 }
        );
      } else {
        // Geolocation not supported
        setUserLocation({
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG
        });
        setIsLoadingLocation(false);
      }
    };
    
    getUserLocation();
  }, []);
  
  // Use mock data for nearby places in Chandigarh area
  const places = nearbyPlacesData.filter(place => {
    if (selectedCategory && selectedCategory !== 'All') {
      return place.category === selectedCategory;
    }
    return true;
  });
  
  const categoryFilters = [
    { name: 'All', icon: <MapPin className="h-4 w-4" />, value: undefined },
    { name: 'Restaurants', icon: <Utensils className="h-4 w-4" />, value: 'restaurant' },
    { name: 'Cafes', icon: <Coffee className="h-4 w-4" />, value: 'cafe' },
    { name: 'Hotels', icon: <Hotel className="h-4 w-4" />, value: 'hotel' },
    { name: 'Shops', icon: <Store className="h-4 w-4" />, value: 'shop' },
    { name: 'Scenic', icon: <Mountain className="h-4 w-4" />, value: 'scenic' }
  ];
  
  // Filter places based on search query
  const filteredPlaces = places.filter(place => {
    if (!searchQuery) return true;
    return place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           place.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           place.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  // Convert Supabase place to PlaceDetails compatible type
  const handlePlaceClick = (place: SupabasePlace) => {
    const placeForDetails: PlaceDetailsType = {
      id: place.id,
      name: place.name,
      type: place.category || 'place', // Ensure type is always defined
      address: place.address,
      rating: place.average_rating || 0,
      reviewCount: place.total_reviews || 0,
      image: place.image_urls?.[0] || '/placeholder.svg',
      distance: place.distance,
      lat: place.latitude,
      lng: place.longitude,
      description: place.description,
      phone: place.phone,
      website: place.website
    };
    
    setSelectedPlace(placeForDetails);
    setIsDetailsOpen(true);
  };
  
  // Function to render place card
  const renderPlaceCard = (place: SupabasePlace) => {
    return (
      <Card 
        key={place.id} 
        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handlePlaceClick(place)}
      >
        <AspectRatio ratio={16/9}>
          <img 
            src={place.image_urls?.[0] || '/placeholder.svg'} 
            alt={place.name}
            className="object-cover w-full h-full"
          />
        </AspectRatio>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold line-clamp-1">{place.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{place.address}</p>
            </div>
            <Badge variant="outline">{place.distance}</Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <Badge className="capitalize">
              {place.category || place.type}
            </Badge>
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
              <span className="text-sm ml-1">
                {place.average_rating?.toFixed(1) || "New"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Function to display loading state
  const renderLoading = () => (
    <div className="flex justify-center items-center h-40">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Finding places near you...</p>
      </div>
    </div>
  );

  // Function to display error state
  const renderError = () => (
    <div className="flex justify-center items-center h-40">
      <div className="flex flex-col items-center space-y-2">
        <CircleAlert className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">Failed to load places. Please try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );

  // Function to display no results
  const renderNoResults = () => (
    <div className="flex justify-center items-center h-40">
      <div className="flex flex-col items-center space-y-2">
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No places found nearby.</p>
        {selectedCategory && (
          <Button variant="outline" onClick={() => setSelectedCategory(undefined)}>
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="container py-6 pb-20">
      <PageHeader 
        heading="Nearby Places" 
        subheading="Discover local attractions and services"
        icon={<MapPin className="h-6 w-6" />}
      />
      
      {/* Search and filters */}
      <div className="space-y-4 my-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search places..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categoryFilters.map((filter) => (
            <Button
              key={filter.name}
              variant={selectedCategory === filter.value ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setSelectedCategory(filter.value)}
            >
              {filter.icon}
              <span className="ml-1">{filter.name}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Places grid */}
      <div className="py-4">
        {isLoadingLocation ? (
          renderLoading()
        ) : filteredPlaces.length === 0 ? (
          renderNoResults()
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaces.map(renderPlaceCard)}
          </div>
        )}
      </div>
      
      {/* Place details modal */}
      <PlaceDetails 
        place={selectedPlace} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
    </div>
  );
}
