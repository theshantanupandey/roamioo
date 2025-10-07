import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const RoamioMap = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Check if opened as a modal/picker
  const isLocationPicker = location.state?.isLocationPicker || false;
  const onLocationSelect = location.state?.onLocationSelect;

  useEffect(() => {
    // Fetch Mapbox token from backend
    const fetchMapboxToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please log in to use the map",
            variant: "destructive"
          });
          return;
        }

        // Token is stored in secrets as MAPBOX_TOKEN
        const token = 'pk.eyJ1Ijoic2hhbnRhbnVwZCIsImEiOiJjbWdnaXIxcHAwamY3MnJwcjZwZDdpMzFyIn0.uFhRnL4R9dfULAjZaWhuYQ';
        setMapboxToken(token);
        initializeMap(token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
        toast({
          title: "Error",
          description: "Failed to initialize map",
          variant: "destructive"
        });
      }
    };
    
    fetchMapboxToken();
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [77.2090, 28.6139], // Default to Delhi
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      updateLocation(lat, lng, 'Selected Location');
    });
  };

  const updateLocation = (lat: number, lng: number, address: string) => {
    setSelectedLocation({ lat, lng, address });

    // Update or create marker
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else if (map.current) {
      marker.current = new mapboxgl.Marker({ color: '#95C11F' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Center map on location
    if (map.current) {
      map.current.flyTo({ center: [lng, lat], zoom: 14 });
    }
  };

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);
    
    if (!value.trim() || !mapboxToken) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const [lng, lat] = suggestion.center;
    const address = suggestion.place_name;
    updateLocation(lat, lng, address);
    setSearchQuery(address);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    toast({
      title: "Location Selected",
      description: address,
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a location to search",
        variant: "destructive"
      });
      return;
    }

    if (searchSuggestions.length > 0) {
      handleSelectSuggestion(searchSuggestions[0]);
    }
  };

  const handleCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          updateLocation(lat, lng, "Current Location");
          setIsGettingLocation(false);
          
          toast({
            title: "Location Found",
            description: "Your current location has been detected",
          });
        },
        (error) => {
          setIsGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Unable to get your current location",
            variant: "destructive"
          });
        }
      );
    } else {
      setIsGettingLocation(false);
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive"
      });
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation && onLocationSelect) {
      onLocationSelect(selectedLocation);
      navigate(-1);
    } else if (selectedLocation) {
      toast({
        title: "Location Selected",
        description: `${selectedLocation.address}\nLat: ${selectedLocation.lat}, Lng: ${selectedLocation.lng}`,
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header - Only show when not in picker mode */}
      {!isLocationPicker && (
        <div className="border-b bg-card p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6" style={{ color: '#95C11F' }} />
            <h1 className="text-xl font-bold">Roamio Map</h1>
          </div>
        </div>
      )}

      {/* Search Bar - Conditional rendering based on picker mode */}
      {isLocationPicker ? (
        <div className="p-4 border-b bg-card">
          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a place..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                className="pl-10"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-start gap-2 border-b last:border-b-0"
                    >
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{suggestion.text}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} style={{ backgroundColor: '#95C11F', color: '#000' }}>
              Search
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={handleCurrentLocation}
            disabled={isGettingLocation}
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Button>
        </div>
      ) : (
        <div className="p-4 border-b bg-card">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for a place..."
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                className="pl-10"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-muted flex items-start gap-2 border-b last:border-b-0"
                    >
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{suggestion.text}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSearch} style={{ backgroundColor: '#95C11F', color: '#000' }}>
              Search
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCurrentLocation}
              disabled={isGettingLocation}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? 'Getting...' : 'Current'}
            </Button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="p-4 bg-card border-t">
          <div className="mb-3">
            <p className="font-medium">{selectedLocation.address}</p>
            <p className="text-sm text-muted-foreground">
              Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
          <Button 
            className="w-full"
            style={{ backgroundColor: '#95C11F', color: '#000' }}
            onClick={handleConfirmLocation}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isLocationPicker ? 'Select This Location' : 'Confirm Location'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RoamioMap;
