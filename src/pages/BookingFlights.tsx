
import { useState } from 'react';
import { ArrowLeft, Plane, Calendar, Users, ArrowUpDown, Filter, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const BookingFlights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departure: '',
    return: '',
    passengers: '1',
    class: 'economy'
  });
  const [tripType, setTripType] = useState('roundtrip');
  const [showResults, setShowResults] = useState(false);

  // Mock flight data
  const mockFlights = [
    {
      id: 1,
      airline: 'Sky Airways',
      logo: '✈️',
      departure: { time: '08:30', airport: 'JFK', city: 'New York' },
      arrival: { time: '12:45', airport: 'LAX', city: 'Los Angeles' },
      duration: '5h 15m',
      stops: 'Non-stop',
      price: 299,
      rating: 4.5
    },
    {
      id: 2,
      airline: 'Global Express',
      logo: '🛩️',
      departure: { time: '14:20', airport: 'JFK', city: 'New York' },
      arrival: { time: '18:55', airport: 'LAX', city: 'Los Angeles' },
      duration: '5h 35m',
      stops: 'Non-stop',
      price: 349,
      rating: 4.3
    },
    {
      id: 3,
      airline: 'Budget Air',
      logo: '🛫',
      departure: { time: '06:15', airport: 'JFK', city: 'New York' },
      arrival: { time: '11:30', airport: 'LAX', city: 'Los Angeles' },
      duration: '6h 15m',
      stops: '1 stop',
      price: 199,
      rating: 4.1
    }
  ];

  const handleSearch = () => {
    if (!searchForm.from || !searchForm.to || !searchForm.departure) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setShowResults(true);
  };

  const handleBooking = (flightId: number) => {
    toast({
      title: "Booking Initiated",
      description: "Redirecting to booking confirmation...",
    });
    // In a real app, this would redirect to a booking flow
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b">
        <div className="px-4 h-14 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Book Flights</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Plane className="h-5 w-5 mr-2 text-[#95C11F]" />
              Flight Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={tripType} onValueChange={setTripType}>
              <TabsList className="bg-muted/40">
                <TabsTrigger value="roundtrip" className="data-[state=active]:bg-[#95C11F] data-[state=active]:text-black">
                  Round Trip
                </TabsTrigger>
                <TabsTrigger value="oneway" className="data-[state=active]:bg-[#95C11F] data-[state=active]:text-black">
                  One Way
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="from"
                    placeholder="Departure city"
                    className="pl-10"
                    value={searchForm.from}
                    onChange={(e) => setSearchForm({...searchForm, from: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="to"
                    placeholder="Destination city"
                    className="pl-10"
                    value={searchForm.to}
                    onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">Departure</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="departure"
                    type="date"
                    className="pl-10"
                    value={searchForm.departure}
                    onChange={(e) => setSearchForm({...searchForm, departure: e.target.value})}
                  />
                </div>
              </div>
              
              {tripType === 'roundtrip' && (
                <div className="space-y-2">
                  <Label htmlFor="return">Return</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="return"
                      type="date"
                      className="pl-10"
                      value={searchForm.return}
                      onChange={(e) => setSearchForm({...searchForm, return: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Passengers</Label>
                <Select value={searchForm.passengers} onValueChange={(value) => setSearchForm({...searchForm, passengers: value})}>
                  <SelectTrigger>
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Passenger</SelectItem>
                    <SelectItem value="2">2 Passengers</SelectItem>
                    <SelectItem value="3">3 Passengers</SelectItem>
                    <SelectItem value="4">4+ Passengers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={searchForm.class} onValueChange={(value) => setSearchForm({...searchForm, class: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSearch}
              className="w-full bg-[#95C11F] hover:bg-[#7a9e19] text-black"
            >
              Search Flights
            </Button>
          </CardContent>
        </Card>

        {showResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Available Flights</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {mockFlights.map((flight) => (
              <Card key={flight.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{flight.logo}</div>
                      <div>
                        <h3 className="font-medium">{flight.airline}</h3>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{flight.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#95C11F]">${flight.price}</div>
                      <div className="text-sm text-muted-foreground">per person</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-medium">{flight.departure.time}</div>
                        <div className="text-sm text-muted-foreground">{flight.departure.airport}</div>
                      </div>
                      <div className="flex flex-col items-center text-muted-foreground">
                        <div className="text-xs">{flight.duration}</div>
                        <ArrowUpDown className="h-4 w-4 rotate-90" />
                        <div className="text-xs">{flight.stops}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{flight.arrival.time}</div>
                        <div className="text-sm text-muted-foreground">{flight.arrival.airport}</div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleBooking(flight.id)}
                      className="bg-[#95C11F] hover:bg-[#7a9e19] text-black"
                    >
                      Book Now
                    </Button>
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

export default BookingFlights;
