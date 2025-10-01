
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Hotel, Ticket, ShoppingCart, Users, Calendar, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { TripCompanions } from '@/components/TripCompanions';
import { useIsMobile } from '@/hooks/use-mobile';

const TripPlanning = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  // Enhanced destinations data with more places
  const popularDestinations = [
    {
      id: 1,
      name: 'Bali',
      country: 'Indonesia',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
      rating: 4.8,
      activities: ['Beaches', 'Culture', 'Food']
    },
    {
      id: 2,
      name: 'Paris',
      country: 'France',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
      rating: 4.7,
      activities: ['Museums', 'Shopping', 'History']
    },
    {
      id: 3,
      name: 'Tokyo',
      country: 'Japan',
      image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
      rating: 4.9,
      activities: ['Technology', 'Food', 'Shopping']
    },
    {
      id: 4,
      name: 'Santorini',
      country: 'Greece',
      image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff',
      rating: 4.6,
      activities: ['Beaches', 'Romance', 'Sunset']
    },
    {
      id: 5,
      name: 'New York',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
      rating: 4.5,
      activities: ['Museums', 'Shows', 'Shopping']
    },
    {
      id: 6,
      name: 'Dubai',
      country: 'UAE',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
      rating: 4.7,
      activities: ['Luxury', 'Desert', 'Shopping']
    },
    {
      id: 7,
      name: 'Iceland',
      country: 'Iceland',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      rating: 4.8,
      activities: ['Nature', 'Adventure', 'Northern Lights']
    },
    {
      id: 8,
      name: 'Maldives',
      country: 'Maldives',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8',
      rating: 4.9,
      activities: ['Beaches', 'Diving', 'Luxury']
    },
  ];
  
  // More comprehensive attractions data
  const attractionsMap = {
    'Bali': [
      {
        id: 1, 
        name: 'Tegallalang Rice Terraces',
        location: 'Bali, Indonesia',
        image: 'https://images.unsplash.com/photo-1531971589569-0d9370cbe1e5',
        rating: 4.7,
        price: '$10',
        description: 'Beautiful terraced rice fields in the village of Tegallalang'
      },
      {
        id: 2, 
        name: 'Uluwatu Temple',
        location: 'Bali, Indonesia',
        image: 'https://images.unsplash.com/photo-1580181977015-4959a70064ca',
        rating: 4.6,
        price: '$15',
        description: 'Sea temple perched on top of a steep cliff with beautiful ocean views'
      },
      {
        id: 3, 
        name: 'Ubud Monkey Forest',
        location: 'Bali, Indonesia',
        image: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd',
        rating: 4.5,
        price: '$12',
        description: 'Natural forest sanctuary and temple complex with wild monkeys'
      },
    ],
    'Paris': [
      {
        id: 4,
        name: 'Eiffel Tower',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f',
        rating: 4.8,
        price: '$25',
        description: 'Iconic iron lattice tower and symbol of Paris'
      },
      {
        id: 5,
        name: 'Louvre Museum',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1566139107669-4b302b827f2e',
        rating: 4.9,
        price: '$20',
        description: 'World\'s largest art museum and historic monument'
      },
      {
        id: 6,
        name: 'Notre-Dame Cathedral',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e',
        rating: 4.7,
        price: 'Free',
        description: 'Medieval Catholic cathedral with Gothic architecture'
      },
    ],
    'Tokyo': [
      {
        id: 7,
        name: 'Senso-ji Temple',
        location: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9',
        rating: 4.6,
        price: 'Free',
        description: 'Ancient Buddhist temple in Asakusa district'
      },
      {
        id: 8,
        name: 'Tokyo Skytree',
        location: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
        rating: 4.5,
        price: '$30',
        description: 'Broadcasting tower and observation decks with city views'
      },
      {
        id: 9,
        name: 'Shibuya Crossing',
        location: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8',
        rating: 4.4,
        price: 'Free',
        description: 'Famous pedestrian scramble crossing in Shibuya district'
      },
    ],
  };
  
  // Get attractions for selected destination
  const getAttractions = () => {
    if (!selectedDestination) return [];
    return attractionsMap[selectedDestination as keyof typeof attractionsMap] || [];
  };
  
  // Enhanced accommodation options with more variety
  const accommodationsMap = {
    'Bali': [
      {
        id: 1,
        name: 'Luxury Ocean Villa',
        location: 'Seminyak, Bali',
        image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6',
        rating: 4.9,
        price: '$250/night',
        sponsored: true,
        amenities: ['Pool', 'Ocean View', 'Breakfast']
      },
      {
        id: 2,
        name: 'Ubud Rainforest Resort',
        location: 'Ubud, Bali',
        image: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5',
        rating: 4.7,
        price: '$175/night',
        sponsored: false,
        amenities: ['Spa', 'Restaurant', 'WiFi']
      },
      {
        id: 3,
        name: 'Beachfront Bungalow',
        location: 'Canggu, Bali',
        image: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae',
        rating: 4.6,
        price: '$120/night',
        sponsored: false,
        amenities: ['Beach Access', 'Breakfast', 'AC']
      },
    ],
    'Paris': [
      {
        id: 4,
        name: 'Le Meurice',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
        rating: 4.8,
        price: '$450/night',
        sponsored: true,
        amenities: ['Spa', 'Restaurant', 'Concierge']
      },
      {
        id: 5,
        name: 'Hotel des Grands Boulevards',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        rating: 4.6,
        price: '$280/night',
        sponsored: false,
        amenities: ['Restaurant', 'Bar', 'WiFi']
      },
    ],
    'Tokyo': [
      {
        id: 6,
        name: 'Park Hyatt Tokyo',
        location: 'Shinjuku, Tokyo',
        image: 'https://images.unsplash.com/photo-1555686491-8b14c3febb9e',
        rating: 4.9,
        price: '$380/night',
        sponsored: true,
        amenities: ['City View', 'Spa', 'Pool']
      },
      {
        id: 7,
        name: 'Capsule Hotel Shibuya',
        location: 'Shibuya, Tokyo',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        rating: 4.2,
        price: '$45/night',
        sponsored: false,
        amenities: ['Shared Bath', 'WiFi', 'Lounge']
      },
    ],
  };
  
  // Get accommodations for selected destination
  const getAccommodations = () => {
    if (!selectedDestination) return [];
    return accommodationsMap[selectedDestination as keyof typeof accommodationsMap] || [];
  };
  
  // Enhanced flight options
  const flights = [
    {
      id: 1,
      airline: 'Emirates',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=EA',
      departure: 'JFK',
      arrival: 'DPS',
      duration: '22h 15m',
      stops: '1 stop (Dubai)',
      price: '$1,250',
      discount: '15% off',
    },
    {
      id: 2,
      airline: 'Singapore Airlines',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=SA',
      departure: 'JFK',
      arrival: 'DPS',
      duration: '24h 45m',
      stops: '1 stop (Singapore)',
      price: '$1,180',
      discount: '10% off',
    },
    {
      id: 3,
      airline: 'Qatar Airways',
      logo: 'https://api.dicebear.com/7.x/initials/svg?seed=QA',
      departure: 'JFK',
      arrival: 'DPS',
      duration: '23h 30m',
      stops: '1 stop (Doha)',
      price: '$1,320',
      discount: null,
    },
  ];
  
  // Enhanced shopping recommendations
  const shoppingMap = {
    'Bali': [
      {
        id: 1,
        name: 'Ubud Art Market',
        location: 'Ubud, Bali',
        image: 'https://images.unsplash.com/photo-1537194721761-21b1d808c337',
        description: 'Traditional art and handicrafts',
        mustBuy: 'Handmade Batik clothing'
      },
      {
        id: 2,
        name: 'Seminyak Village',
        location: 'Seminyak, Bali',
        image: 'https://images.unsplash.com/photo-1567337710282-00832b415979',
        description: 'Upscale shopping mall with local designers',
        mustBuy: 'Balinese silver jewelry'
      },
    ],
    'Paris': [
      {
        id: 3,
        name: 'Champs-Élysées',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
        description: 'Famous avenue with luxury boutiques',
        mustBuy: 'French perfume and fashion'
      },
      {
        id: 4,
        name: 'Le Marché aux Puces',
        location: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0',
        description: 'Famous flea market with antiques',
        mustBuy: 'Vintage French items'
      },
    ],
    'Tokyo': [
      {
        id: 5,
        name: 'Shibuya Center Gai',
        location: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989',
        description: 'Vibrant shopping district',
        mustBuy: 'Japanese electronics and fashion'
      },
    ],
  };
  
  // Get shopping recommendations for selected destination
  const getShopping = () => {
    if (!selectedDestination) return [];
    return shoppingMap[selectedDestination as keyof typeof shoppingMap] || [];
  };
  
  // Handle navigating to specific step
  const navigateToStep = (targetStep: number) => {
    if (targetStep >= 1 && targetStep <= 5) {
      setStep(targetStep);
    }
  };

  // Handle selecting a destination
  const handleSelectDestination = (id: number) => {
    const destination = popularDestinations.find(dest => dest.id === id);
    setSelectedDestination(destination?.name || null);
    toast({
      title: "Destination selected",
      description: `You've selected ${destination?.name}, ${destination?.country}`
    });
    setStep(2);
  };
  
  // Handle adding activities
  const handleToggleActivity = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };
  
  // Handle completing companions step
  const handleCompanionsComplete = () => {
    toast({
      title: "Companions added",
      description: "Your travel companions have been added to your trip."
    });
    setStep(4);
  };
  
  // Handle booking accommodation
  const handleBookAccommodation = (id: number) => {
    toast({
      title: "Accommodation booked",
      description: "Your accommodation has been added to your trip."
    });
    setStep(5);
  };
  
  // Handle booking flights
  const handleBookFlight = (id: number) => {
    toast({
      title: "Flight booked", 
      description: "Your flight has been added to your trip."
    });
    navigateToStep(5);
  };
  
  // Complete planning
  const handleFinishPlanning = () => {
    toast({
      title: "Trip planning completed!",
      description: "Your trip has been created successfully."
    });
    // Navigate to trips page or the newly created trip
    navigate('/trips');
  };
  
  // Generate step indicator classnames
  const getStepClass = (stepNumber: number) => {
    return `w-8 h-8 rounded-full flex items-center justify-center ${
      step >= stepNumber ? 'bg-[#d8fa3c] text-black' : 'bg-muted text-muted-foreground'
    }`;
  };

  // Get step name for current step
  const getStepName = () => {
    switch(step) {
      case 1: return "Choose Destination";
      case 2: return "Select Activities";
      case 3: return "Add Companions";
      case 4: return "Book Stay";
      case 5: return "Finalize";
      default: return "";
    }
  };
  
  return (
    <div className="container px-4 pb-24">
      <div className="my-4">
        <h1 className="text-2xl font-bold">Plan Your Dream Trip</h1>
        <p className="text-muted-foreground">Follow our guided steps to create your perfect journey</p>
      </div>
      
      {/* Progress indicators - clickable */}
      <div className="flex justify-between mb-6 px-2">
        <div 
          className="flex flex-col items-center cursor-pointer" 
          onClick={() => selectedDestination && navigateToStep(1)}
        >
          <div className={getStepClass(1)}>1</div>
          <span className="text-xs mt-1">Destination</span>
        </div>
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => selectedDestination && navigateToStep(2)}
        >
          <div className={getStepClass(2)}>2</div>
          <span className="text-xs mt-1">Activities</span>
        </div>
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => selectedActivities.length > 0 && navigateToStep(3)}
        >
          <div className={getStepClass(3)}>3</div>
          <span className="text-xs mt-1">Companions</span>
        </div>
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => step > 3 && navigateToStep(4)}
        >
          <div className={getStepClass(4)}>4</div>
          <span className="text-xs mt-1">Stay</span>
        </div>
        <div 
          className="flex flex-col items-center cursor-pointer"
          onClick={() => step > 4 && navigateToStep(5)}
        >
          <div className={getStepClass(5)}>5</div>
          <span className="text-xs mt-1">Finish</span>
        </div>
      </div>
      
      {/* Current step title with back button when applicable */}
      {step > 1 && (
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setStep(step - 1)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h2 className="text-lg font-semibold">{getStepName()}</h2>
          <div className="w-16"></div> {/* Spacer for centering */}
        </div>
      )}
      
      {/* Step 1: Choose Destination */}
      {step === 1 && (
        <div className="animate-fade-in">
          {step === 1 && !isMobile && (
            <h2 className="text-xl font-semibold mb-4">Choose Your Destination</h2>
          )}
          
          <div className="mb-4">
            <Input 
              placeholder="Search destinations..." 
              className="mb-4"
              prefix={<MapPin className="h-4 w-4" />}
            />
          </div>
          
          <div className="grid gap-4">
            {popularDestinations.map((destination) => (
              <Card 
                key={destination.id} 
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedDestination === destination.name ? 'ring-2 ring-[#d8fa3c]' : 'hover:shadow-md'
                }`}
                onClick={() => handleSelectDestination(destination.id)}
              >
                <div className="relative h-32 sm:h-40">
                  <img 
                    src={destination.image} 
                    alt={destination.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <h3 className="text-white font-semibold">{destination.name}, {destination.country}</h3>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="flex text-amber-500 mr-1">
                        {[...Array(5)].map((_, i) => (
                          <svg 
                            key={i} 
                            className={`w-3 h-3 ${i < Math.floor(destination.rating) ? 'fill-current' : 'stroke-current fill-none'}`} 
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm">{destination.rating}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {destination.activities.map((activity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{activity}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 2: Explore Attractions */}
      {step === 2 && (
        <div className="animate-fade-in">
          {!isMobile && (
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Explore {selectedDestination} Attractions</h2>
            </div>
          )}
          
          <Tabs defaultValue="attractions">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="attractions">Places to Visit</TabsTrigger>
              <TabsTrigger value="food">Food & Dining</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
            </TabsList>
            
            <TabsContent value="attractions" className="space-y-4">
              {getAttractions().map((attraction) => (
                <Card key={attraction.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row h-auto sm:h-36">
                    <div className="w-full sm:w-1/3 h-32 sm:h-full">
                      <img 
                        src={attraction.image} 
                        alt={attraction.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-full sm:w-2/3 p-3 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold">{attraction.name}</h3>
                        <p className="text-xs text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {attraction.location}
                        </p>
                        <p className="text-sm mt-1">{attraction.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <div className="flex text-amber-500 mr-1">
                            {[...Array(5)].map((_, i) => (
                              <svg 
                                key={i} 
                                className={`w-3 h-3 ${i < Math.floor(attraction.rating) ? 'fill-current' : 'stroke-current fill-none'}`} 
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs">{attraction.rating}</span>
                          <span className="text-xs ml-2 text-muted-foreground">{attraction.price}</span>
                        </div>
                        <Button 
                          size="sm"
                          variant={selectedActivities.includes(attraction.name) ? "default" : "outline"}
                          className={selectedActivities.includes(attraction.name) ? "bg-[#d8fa3c] text-black hover:bg-[#c8e82c]" : ""}
                          onClick={() => handleToggleActivity(attraction.name)}
                        >
                          {selectedActivities.includes(attraction.name) ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="flex justify-end mt-4">
                <Button 
                  className="bg-[#d8fa3c] text-black hover:bg-[#c8e82c]"
                  onClick={() => setStep(3)}
                  disabled={selectedActivities.length === 0}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="food" className="text-center py-8">
              <p className="text-muted-foreground">Coming soon! Local restaurants and dining options.</p>
            </TabsContent>
            
            <TabsContent value="activities" className="text-center py-8">
              <p className="text-muted-foreground">Coming soon! Fun activities and experiences.</p>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Step 3: Trip Companions (Moved before accommodation) */}
      {step === 3 && (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h3 className="font-medium flex items-center mb-3">
              <Users className="mr-2 h-4 w-4" />
              Add Trip Companions
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Who's joining you on this adventure to {selectedDestination}?
            </p>
            
            <TripCompanions />
            
            <div className="flex justify-end mt-6">
              <Button 
                className="bg-[#d8fa3c] text-black hover:bg-[#c8e82c]"
                onClick={handleCompanionsComplete}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {step === 4 && (
        <div className="animate-fade-in">
          <div>
            <p className="text-sm text-muted-foreground mb-4">Where would you like to stay in {selectedDestination}?</p>
          </div>
          
          <div className="space-y-4">
            {getAccommodations().map((accommodation) => (
              <Card key={accommodation.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row h-auto sm:h-36">
                  <div className="w-full sm:w-1/3 h-32 sm:h-full">
                    <div className="relative h-full">
                      <img 
                        src={accommodation.image} 
                        alt={accommodation.name}
                        className="w-full h-full object-cover"
                      />
                      {accommodation.sponsored && (
                        <Badge className="absolute top-1 left-1 bg-[#d8fa3c] text-black">
                          OYO Partner
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-full sm:w-2/3 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold">{accommodation.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {accommodation.location}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {accommodation.amenities.map((amenity, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center">
                        <div className="flex text-amber-500 mr-1">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i} 
                              className={`w-3 h-3 ${i < Math.floor(accommodation.rating) ? 'fill-current' : 'stroke-current fill-none'}`} 
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs">{accommodation.rating}</span>
                        <span className="text-xs ml-2 font-medium">{accommodation.price}</span>
                      </div>
                      <Button 
                        size="sm"
                        className="bg-[#d8fa3c] text-black hover:bg-[#c8e82c]"
                        onClick={() => handleBookAccommodation(accommodation.id)}
                      >
                        <Hotel className="mr-1 h-4 w-4" />
                        Book
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {step === 5 && (
        <div className="animate-fade-in">
          <div className="mb-6">
            <h3 className="font-medium flex items-center mb-3">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shopping Recommendations
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {getShopping().map((shop) => (
                <Card key={shop.id} className="overflow-hidden">
                  <div className="flex h-24">
                    <div className="w-1/4">
                      <img 
                        src={shop.image} 
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-3/4 p-3">
                      <h4 className="font-medium text-sm">{shop.name}</h4>
                      <p className="text-xs text-muted-foreground">{shop.location}</p>
                      <p className="text-xs mt-1">{shop.description}</p>
                      <p className="text-xs mt-1 font-medium">Must buy: {shop.mustBuy}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-3">Trip Summary</h3>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium">Destination</p>
                    <p className="text-sm text-muted-foreground">{selectedDestination || 'Not selected'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-muted-foreground">July 15 - July 22, 2024</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-amber-500" />
                  <div>
                    <p className="font-medium">Travel Companions</p>
                    <p className="text-sm text-muted-foreground">2 companions</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Hotel className="h-4 w-4 mr-2 text-purple-500" />
                  <div>
                    <p className="font-medium">Accommodation</p>
                    <p className="text-sm text-muted-foreground">Selected accommodation</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Ticket className="h-4 w-4 mr-2 text-orange-500" />
                  <div>
                    <p className="font-medium">Flight</p>
                    <p className="text-sm text-muted-foreground">To be selected</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium">Selected Activities</p>
                    <p className="text-sm text-muted-foreground">{selectedActivities.join(", ") || "None"}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <Button 
            className="w-full bg-[#d8fa3c] text-black hover:bg-[#c8e82c]"
            size="lg"
            onClick={handleFinishPlanning}
          >
            Complete Trip Planning
          </Button>
        </div>
      )}
    </div>
  );
};

export default TripPlanning;
