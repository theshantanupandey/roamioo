
import { useState } from 'react';
import { ArrowLeft, Train, Calendar, Users, ArrowUpDown, Filter, MapPin, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const BookingTrains = () => {
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

  // Mock train data
  const mockTrains = [
    {
      id: 1,
      operator: 'Express Rail',
      trainNumber: 'ER-2045',
      departure: { time: '07:30', station: 'Central Station', city: 'New York' },
      arrival: { time: '12:15', station: 'Union Station', city: 'Washington DC' },
      duration: '4h 45m',
      type: 'High Speed',
      price: 89,
      amenities: ['WiFi', 'Power Outlets', 'Dining Car']
    },
    {
      id: 2,
      operator: 'Regional Transit',
      trainNumber: 'RT-1532',
      departure: { time: '10:20', station: 'Central Station', city: 'New York' },
      arrival: { time: '15:30', station: 'Union Station', city: 'Washington DC' },
      duration: '5h 10m',
      type: 'Regional',
      price: 65,
      amenities: ['WiFi', 'Power Outlets']
    },
    {
      id: 3,
      operator: 'Premium Rails',
      trainNumber: 'PR-8901',
      departure: { time: '16:45', station: 'Central Station', city: 'New York' },
      arrival: { time: '21:20', station: 'Union Station', city: 'Washington DC' },
      duration: '4h 35m',
      type: 'Premium',
      price: 129,
      amenities: ['WiFi', 'Power Outlets', 'Dining Car', 'Business Lounge']
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

  const handleBooking = (trainId: number) => {
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
          <h1 className="text-lg font-semibold">Book Trains</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <Train className="h-5 w-5 mr-2 text-[#95C11F]" />
              Train Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="from"
                    placeholder="Departure station"
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
                    placeholder="Destination station"
                    className="pl-10"
                    value={searchForm.to}
                    onChange={(e) => setSearchForm({...searchForm, to: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure">Departure Date</Label>
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
            </div>

            <Button 
              onClick={handleSearch}
              className="w-full bg-[#95C11F] hover:bg-[#7a9e19] text-black"
            >
              Search Trains
            </Button>
          </CardContent>
        </Card>

        {showResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Available Trains</h2>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            {mockTrains.map((train) => (
              <Card key={train.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Train className="h-6 w-6 text-[#95C11F]" />
                      <div>
                        <h3 className="font-medium">{train.operator}</h3>
                        <p className="text-sm text-muted-foreground">{train.trainNumber}</p>
                      </div>
                      <Badge variant="secondary" className="bg-[#95C11F]/10 text-[#95C11F]">
                        {train.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#95C11F]">${train.price}</div>
                      <div className="text-sm text-muted-foreground">per person</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-medium">{train.departure.time}</div>
                        <div className="text-sm text-muted-foreground">{train.departure.station}</div>
                      </div>
                      <div className="flex flex-col items-center text-muted-foreground">
                        <div className="text-xs">{train.duration}</div>
                        <ArrowUpDown className="h-4 w-4 rotate-90" />
                        <Clock className="h-3 w-3" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{train.arrival.time}</div>
                        <div className="text-sm text-muted-foreground">{train.arrival.station}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {train.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handleBooking(train.id)}
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

export default BookingTrains;
