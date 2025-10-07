import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  
  // Check if opened as a modal/picker
  const isLocationPicker = location.state?.isLocationPicker || false;
  const onLocationSelect = location.state?.onLocationSelect;

  useEffect(() => {
    // Prompt for Mapbox token if not set
    const storedToken = localStorage.getItem('mapboxToken');
    if (storedToken) {
      setMapboxToken(storedToken);
      initializeMap(storedToken);
    } else {
      toast({
        title: "Mapbox Token Required",
        description: "Please enter your Mapbox public token to use the map",
      });
    }
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a location to search",
        variant: "destructive"
      });
      return;
    }

    if (!mapboxToken) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox token first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const address = data.features[0].place_name;
        updateLocation(lat, lng, address);
        
        toast({
          title: "Location Found",
          description: address,
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Please try a different search term",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for location",
        variant: "destructive"
      });
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

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapboxToken', mapboxToken);
      initializeMap(mapboxToken);
      toast({
        title: "Token Saved",
        description: "Mapbox token has been saved and map initialized",
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Roamio Map</h1>
        </div>
        {isLocationPicker && (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Token Input (if not set) */}
      {!localStorage.getItem('mapboxToken') && (
        <div className="p-4 bg-muted border-b">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleTokenSubmit} style={{ backgroundColor: '#95C11F', color: '#000' }}>
              Save Token
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Get your free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
          </p>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b bg-card">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
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
