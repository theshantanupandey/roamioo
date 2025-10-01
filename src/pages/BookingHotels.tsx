import { useState } from 'react';
import { ArrowLeft, Hotel, Calendar, Users, Star, MapPin, Wifi, Car, Coffee, Dumbbell, Waves, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const BookingHotels = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchForm, setSearchForm] = useState({
    destination: '',
    checkin: '',
    checkout: '',
    guests: '2',
    rooms: '1'
  });
  const [showResults, setShowResults] = useState(false);

  // Mock hotel data
  const mockHotels = [
    {
      id: 1,
      name: 'Grand Plaza Hotel',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop',
      rating: 4.8,
      reviews: 1250,
      location: 'Downtown District',
      distance: '0.5 miles from center',
      price: 189,
      originalPrice: 220,
      amenities: ['Wifi', 'Pool', 'Gym', 'Restaurant', 'Parking'],
      description: 'Luxury hotel with stunning city views'
    },
    {
      id: 2,
      name: 'Boutique Inn & Suites',
      image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop',
      rating: 4.5,
      reviews: 890,
      location: 'Historic Quarter',
      distance: '1.2 miles from center',
      price: 129,
      originalPrice: 150,
      amenities: ['Wifi', 'Restaurant', 'Coffee Shop'],
      description: 'Charming boutique hotel with personalized service'
    },
    {
      id: 3,
      name: 'Business Center Hotel',
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&h=200&fit=crop',
      rating: 4.3,
      reviews: 2100,
      location: 'Business District',
      distance: '2.1 miles from center',
      price: 99,
      originalPrice: 120,
      amenities: ['Wifi', 'Gym', 'Business Center', 'Parking'],
      description: 'Modern hotel perfect for business travelers'
    }
  ];

  const amenityIcons: { [key: string]: any } = {
    'Wifi': Wifi,
    'Pool': Waves, // Changed from Pool to Waves since Pool doesn't exist
    'Gym': Dumbbell,
    'Restaurant': Utensils,
    'Parking': Car,
    'Coffee Shop': Coffee,
    'Business Center': MapPin
  };

  const handleSearch = () => {
    if (!searchForm.destination || !searchForm.checkin || !searchForm.checkout) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setShowResults(true);
  };

  const handleBooking = (hotelId: number) => {
    toast({
      title: "Booking Initiated",
      description: "Redirecting to booking confirmation...",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b">
        <div className="px-4 h-14 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Book Hotels</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Hotel className="h-5 w-5 mr-2 text-[#95C11F]" />
              Hotel Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination"
                  placeholder="Where are you going?"
                  className="pl-10"
                  value={searchForm.destination}
                  onChange={(e) => setSearchForm({...searchForm, destination: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkin">Check-in</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="checkin"
                    type="date"
                    className="pl-10"
                    value={searchForm.checkin}
                    onChange={(e) => setSearchForm({...searchForm, checkin: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="checkout">Check-out</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="checkout"
                    type="date"
                    className="pl-10"
                    value={searchForm.checkout}
                    onChange={(e) => setSearchForm({...searchForm, checkout: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guests</Label>
                <Select value={searchForm.guests} onValueChange={(value) => setSearchForm({...searchForm, guests: value})}>
                  <SelectTrigger>
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4">4+ Guests</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Rooms</Label>
                <Select value={searchForm.rooms} onValueChange={(value) => setSearchForm({...searchForm, rooms: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Room</SelectItem>
                    <SelectItem value="2">2 Rooms</SelectItem>
                    <SelectItem value="3">3 Rooms</SelectItem>
                    <SelectItem value="4">4+ Rooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSearch}
              className="w-full bg-[#95C11F] hover:bg-[#7a9e19] text-black"
            >
              Search Hotels
            </Button>
          </CardContent>
        </Card>

        {showResults && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Available Hotels</h2>

            {mockHotels.map((hotel) => (
              <Card key={hotel.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3">
                      <img 
                        src={hotel.image} 
                        alt={hotel.name}
                        className="w-full h-48 md:h-full object-cover rounded-l-lg"
                      />
                    </div>
                    <div className="md:w-2/3 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{hotel.name}</h3>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{hotel.rating}</span>
                            <span>({hotel.reviews} reviews)</span>
                          </div>
                        </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground line-through">
                          ₹{(hotel.originalPrice * 83).toLocaleString('en-IN')}
                        </div>
                        <div className="text-2xl font-bold text-[#95C11F]">
                          ₹{(hotel.price * 83).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                        <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full inline-block mt-1">
                          OYO Partner
                        </div>
                      </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{hotel.description}</p>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{hotel.location} • {hotel.distance}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {hotel.amenities.map((amenity) => {
                          const IconComponent = amenityIcons[amenity] || MapPin;
                          return (
                            <Badge key={amenity} variant="outline" className="flex items-center gap-1">
                              <IconComponent className="h-3 w-3" />
                              {amenity}
                            </Badge>
                          );
                        })}
                      </div>

                      <Button 
                        onClick={() => handleBooking(hotel.id)}
                        className="w-full md:w-auto bg-[#95C11F] hover:bg-[#7a9e19] text-black"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHotels;
