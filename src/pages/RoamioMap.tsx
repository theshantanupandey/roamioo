import { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const RoamioMap = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Check if opened as a modal/picker
  const isLocationPicker = location.state?.isLocationPicker || false;
  const onLocationSelect = location.state?.onLocationSelect;

  useEffect(() => {
    // Initialize map here - for now using placeholder
    toast({
      title: "Map Loading",
      description: "Roamio Map interface is being prepared...",
    });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a location",
        description: "Please enter a location to search",
        variant: "destructive"
      });
      return;
    }

    // Placeholder for geocoding API
    toast({
      title: "Searching...",
      description: `Looking for "${searchQuery}"`,
    });

    // Mock location for demo
    const mockLocation: LocationData = {
      lat: 28.6139,
      lng: 77.2090,
      address: searchQuery
    };
    
    setSelectedLocation(mockLocation);
  };

  const handleCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: "Current Location"
          };
          
          setSelectedLocation(locationData);
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
          <Button onClick={handleSearch}>
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
      <div className="flex-1 relative bg-muted">
        {/* Placeholder map - would integrate with actual map library */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Interactive Map</h3>
            <p className="text-muted-foreground mb-4">
              Search for a location or use current location
            </p>
            {selectedLocation && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="font-medium">{selectedLocation.address}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Action */}
      {selectedLocation && (
        <div className="p-4 border-t bg-card">
          <Button 
            className="w-full bg-[#95C11F] hover:bg-[#7a9e19] text-black"
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