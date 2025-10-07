import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, ChevronRight, Compass, Route, Heart, Users, Bell, Plane, Globe, Backpack, TrendingUp, MapPinned, Star, Book, Coffee, Hotel, Store, Navigation, MessageSquare, Search, PlusCircle, Languages, Train, CreditCard, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TripCard } from '@/components/TripCard';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNative } from '@/hooks/use-native';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Journal from '@/components/Journal';
import { Input } from '@/components/ui/input';
import AddPlaceForm from '@/components/AddPlaceForm';
import PlaceDetails from '@/components/PlaceDetails';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FeaturedDestinationCard } from '@/components/FeaturedDestinationCard';

const LOCALSTORAGE_KEY = 'wander_trips';
const SCROLL_POSITION_KEY = 'homepage_scroll_position';

const Index = () => {
  const { toast } = useToast();
  const { safeAreaClasses } = useNative();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [upcomingTrips, setUpcomingTrips] = useState<any[]>([]);
  const [featuredDestinations, setFeaturedDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explore");
  const [userFirstName, setUserFirstName] = useState<string>('');
  
  // Refs for scroll position management
  const pageRef = useRef<HTMLDivElement>(null);
  const bookingSectionRef = useRef<HTMLDivElement>(null);
  const travelerToolsRef = useRef<HTMLDivElement>(null);
  const featuredDestinationsRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);

  // Save scroll position before navigation
  const saveScrollPosition = () => {
    if (pageRef.current) {
      sessionStorage.setItem(SCROLL_POSITION_KEY, pageRef.current.scrollTop.toString());
    }
  };

  // Restore scroll position when returning to homepage
  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedPosition && pageRef.current) {
        setTimeout(() => {
          pageRef.current?.scrollTo({
            top: parseInt(savedPosition),
            behavior: 'smooth'
          });
        }, 100);
      }
    };

    // Only restore if coming back from another page
    if (location.state?.from) {
      restoreScrollPosition();
    }
  }, [location.state]);

  useEffect(() => {
    const loadTrips = () => {
      try {
        const stored = localStorage.getItem(LOCALSTORAGE_KEY);
        if (stored) {
          const allTrips = JSON.parse(stored);
          const upcoming = allTrips.filter((trip: any) => trip.status === 'upcoming').slice(0, 2);
          setUpcomingTrips(upcoming);
        }
      } catch (error) {
        console.error('Error loading trips:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  // Fetch user's first name from database
  useEffect(() => {
    const fetchUserFirstName = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name')
          .eq('id', user.id)
          .single();
        if (!error && data?.first_name) {
          setUserFirstName(data.first_name);
        }
      } catch (error) {
        console.error('Error fetching user first name:', error);
      }
    };
    fetchUserFirstName();
  }, [user?.id]);

  // Fetch featured destinations from backend
  useEffect(() => {
    const fetchFeaturedDestinations = async () => {
      try {
        setFeaturedLoading(true);
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('is_verified', true)
          .order('average_rating', { ascending: false })
          .limit(8);
        if (error) throw error;
        setFeaturedDestinations(data || []);
      } catch (error) {
        console.error('Error fetching featured destinations:', error);
      } finally {
        setFeaturedLoading(false);
      }
    };
    fetchFeaturedDestinations();
  }, []);

  const getGreeting = () => {
    if (!user) return 'Hello, Explorer!';
    if (userFirstName) {
      return `Hello, ${userFirstName}!`;
    }
    if (user.user_metadata?.first_name) {
      return `Hello, ${user.user_metadata.first_name}!`;
    }
    return 'Hello, Explorer!';
  };

  const handleDestinationClick = (place: any) => {
    saveScrollPosition();
    navigate(`/place/${place.id}`, { state: { from: 'homepage' } });
  };

  const handleTripClick = (tripId: string) => {
    saveScrollPosition();
    navigate(`/trip-planning?trip=${tripId}`, { state: { from: 'homepage' } });
  };

  const handleNavigationWithScroll = (path: string, sectionRef?: React.RefObject<HTMLDivElement>) => {
    if (sectionRef?.current) {
      const elementTop = sectionRef.current.offsetTop;
      sessionStorage.setItem(SCROLL_POSITION_KEY, elementTop.toString());
    }
    saveScrollPosition();
    navigate(path, { state: { from: 'homepage' } });
  };

  return (
    <div ref={pageRef} className="flex flex-col p-4 pb-20">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}</h1>
          <p className="text-sm text-muted-foreground">Where to next?</p>
        </div>
        <Button size="icon" variant="outline" className="rounded-full h-10 w-10">
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="bg-muted/40 p-1">
          <TabsTrigger value="explore" className="rounded-full data-[state=active]:bg-[#95C11F] data-[state=active]:text-black">
            <Compass className="h-4 w-4 mr-2" />
            Explore
          </TabsTrigger>
          <TabsTrigger value="trending" className="rounded-full data-[state=active]:bg-[#95C11F] data-[state=active]:text-black">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="nearby" className="rounded-full data-[state=active]:bg-[#95C11F] data-[state=active]:text-black">
            <MapPinned className="h-4 w-4 mr-2" />
            Nearby
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="mt-4 space-y-5">
          <div ref={featuredDestinationsRef} className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <Globe className="h-5 w-5 mr-2 text-[#95C11F]" />
                Featured Destinations
              </h2>
              <Link 
                to="/discover" 
                className="text-xs flex items-center text-[#95C11F]"
                onClick={() => handleNavigationWithScroll('/discover', featuredDestinationsRef)}
              >
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            
            {featuredLoading ? (
              <>
                {/* Mobile loading - 1 row */}
                <div className="flex gap-3 overflow-x-auto pb-2 md:hidden hide-scrollbar">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-muted animate-pulse rounded-lg h-48 min-w-[150px]" />
                  ))}
                </div>
                {/* Tablet loading - 2 rows */}
                <div className="hidden md:block lg:hidden">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[1, 2].map(i => (
                      <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[3, 4].map(i => (
                      <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
                    ))}
                  </div>
                </div>
                {/* Desktop loading - 2 rows */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[5, 6, 7, 8].map(i => (
                      <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
                    ))}
                  </div>
                </div>
              </>
            ) : featuredDestinations.length > 0 ? (
              <>
                {/* Mobile horizontal scroll - 1 row */}
                <div className="flex gap-3 overflow-x-auto pb-2 md:hidden hide-scrollbar">
                  {featuredDestinations.slice(0, 4).map(place => (
                    <FeaturedDestinationCard
                      key={place.id}
                      id={place.id}
                      name={place.name}
                      city={place.city}
                      country={place.country}
                      image_url={place.image_urls?.[0] || '/placeholder.svg'}
                      average_rating={place.average_rating}
                      total_reviews={place.total_reviews}
                      category={place.category}
                      onClick={() => handleDestinationClick(place)}
                    />
                  ))}
                </div>
                {/* Tablet grid - 2 rows */}
                <div className="hidden md:block lg:hidden">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {featuredDestinations.slice(0, 2).map(place => (
                      <FeaturedDestinationCard
                        key={place.id}
                        id={place.id}
                        name={place.name}
                        city={place.city}
                        country={place.country}
                        image_url={place.image_urls?.[0] || '/placeholder.svg'}
                        average_rating={place.average_rating}
                        total_reviews={place.total_reviews}
                        category={place.category}
                        onClick={() => handleDestinationClick(place)}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {featuredDestinations.slice(2, 4).map(place => (
                      <FeaturedDestinationCard
                        key={place.id}
                        id={place.id}
                        name={place.name}
                        city={place.city}
                        country={place.country}
                        image_url={place.image_urls?.[0] || '/placeholder.svg'}
                        average_rating={place.average_rating}
                        total_reviews={place.total_reviews}
                        category={place.category}
                        onClick={() => handleDestinationClick(place)}
                      />
                    ))}
                  </div>
                </div>
                {/* Desktop grid - 2 rows */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {featuredDestinations.slice(0, 4).map(place => (
                      <FeaturedDestinationCard
                        key={place.id}
                        id={place.id}
                        name={place.name}
                        city={place.city}
                        country={place.country}
                        image_url={place.image_urls?.[0] || '/placeholder.svg'}
                        average_rating={place.average_rating}
                        total_reviews={place.total_reviews}
                        category={place.category}
                        onClick={() => handleDestinationClick(place)}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {featuredDestinations.slice(4, 8).map(place => (
                      <FeaturedDestinationCard
                        key={place.id}
                        id={place.id}
                        name={place.name}
                        city={place.city}
                        country={place.country}
                        image_url={place.image_urls?.[0] || '/placeholder.svg'}
                        average_rating={place.average_rating}
                        total_reviews={place.total_reviews}
                        category={place.category}
                        onClick={() => handleDestinationClick(place)}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">Not enough content to explore yet</p>
                <Button variant="outline" asChild>
                  <Link to="/discover">Discover Places</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Card className="border overflow-hidden shadow-sm bg-card hover:shadow-md transition-all">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="bg-[#95C11F]/10 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-[#95C11F]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trips</p>
                  <p className="text-lg font-semibold">{upcomingTrips.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <Plane className="h-5 w-5 mr-2 text-[#95C11F]" />
                Upcoming Trips
              </h2>
              <Link 
                to="/trips" 
                className="text-xs flex items-center text-[#95C11F]"
                onClick={() => saveScrollPosition()}
              >
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                <Card className="h-36 animate-pulse bg-muted" />
                <Card className="h-36 animate-pulse bg-muted" />
              </div>
            ) : upcomingTrips.length > 0 ? (
              <div className="space-y-3">
                {upcomingTrips.map(trip => (
                  <TripCard key={trip.id} {...trip} className="hover:shadow-md transition-all" />
                ))}
              </div>
            ) : (
              <Card className="py-8 text-center border-dashed border-2">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-8 w-8 text-gray-400 mb-1" />
                  <p className="text-sm text-muted-foreground">No upcoming trips</p>
                  <div className="flex flex-col gap-2 mt-2 w-full max-w-[200px]">
                    <Button className="bg-[#95C11F] text-black hover:bg-[#7a9e19]" asChild>
                      <Link to="/trips/new">
                        <Plane className="mr-2 h-4 w-4" />
                        Create a Trip
                      </Link>
                    </Button>
                    <Button variant="outline" className="border-[#95C11F] text-[#95C11F] hover:bg-[#95C11F]/10" asChild>
                      <Link to="/trip-planning">
                        <Calendar className="mr-2 h-4 w-4" />
                        Trip Planning
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#95C11F]" />
                Popular Creators
              </h2>
              <Link 
                to="/discover" 
                className="text-xs flex items-center text-[#95C11F]"
                onClick={() => saveScrollPosition()}
              >
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No creators to follow yet</p>
              <Button variant="outline" asChild>
                <Link to="/discover">Discover Creators</Link>
              </Button>
            </div>
          </div>

          {/* Journal Section */}
          <div ref={journalRef} className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <Book className="h-5 w-5 mr-2 text-[#95C11F]" />
                My Journal
              </h2>
              <Link 
                to="/journal" 
                className="text-xs flex items-center text-[#95C11F]"
                onClick={() => handleNavigationWithScroll('/journal', journalRef)}
              >
                View all <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
            
            <Journal maxEntries={1} showAllControls={false} />
          </div>

          <div className="mt-2">
            <Link 
              to="/follow-path" 
              className="block"
              onClick={() => saveScrollPosition()}
            >
              <div className="relative overflow-hidden rounded-xl shadow-lg">
                <div className="bg-gradient-to-r from-[#332b4a] to-[#201a2c] p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-white">Follow Path</h2>
                      <p className="text-gray-300 text-sm">Experience guided journeys with navigation</p>
                      <Button className="mt-2 bg-[#95C11F] text-black hover:bg-[#7a9e19] border-none">
                        Explore Paths
                        <Route className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="hidden md:block bg-[#95C11F]/20 p-4 rounded-full">
                      <Route className="h-16 w-16 text-[#95C11F]" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <div className="absolute top-4 right-8 bg-[#95C11F]/10 h-16 w-16 rounded-full"></div>
                  <div className="absolute bottom-4 left-8 bg-[#95C11F]/10 h-8 w-8 rounded-full"></div>
                </div>
              </div>
            </Link>
          </div>
          
          <div ref={travelerToolsRef} className="border rounded-xl overflow-hidden shadow-sm bg-card/50">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center">
                <Backpack className="h-5 w-5 mr-2 text-[#95C11F]" />
                Traveler Tools
              </h2>
            </div>
            <div className="divide-y">
              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/translation', travelerToolsRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/10 p-2 rounded-full">
                    <Languages className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Translation</p>
                    <p className="text-xs text-muted-foreground">Translate conversations on the go</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/discover', travelerToolsRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <Compass className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Discover Places</p>
                    <p className="text-xs text-muted-foreground">Find popular destinations</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/roamio-map', travelerToolsRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(149, 193, 31, 0.1)' }}>
                    <MapPin className="h-5 w-5" style={{ color: '#95C11F' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Roamio Map</p>
                    <p className="text-xs text-muted-foreground">Interactive map with location search</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/adventure-sports', travelerToolsRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 p-2 rounded-full">
                    <Mountain className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Adventure Sports</p>
                    <p className="text-xs text-muted-foreground">Extreme activities & sports</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div ref={bookingSectionRef} className="border rounded-xl overflow-hidden shadow-sm bg-card/50">
            <div className="p-4 border-b">
              <h2 className="font-semibold flex items-center">
                <Plane className="h-5 w-5 mr-2 text-[#95C11F]" />
                Book Your Journey
              </h2>
            </div>
            <div className="divide-y">
              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/booking/flights', bookingSectionRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-full">
                    <Plane className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Book Flights</p>
                    <p className="text-xs text-muted-foreground">Find the best flight deals</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/booking/trains', bookingSectionRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-full">
                    <Train className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Book Trains</p>
                    <p className="text-xs text-muted-foreground">Train tickets & schedules</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>

              <div 
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleNavigationWithScroll('/booking/hotels', bookingSectionRef)}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-full">
                    <Hotel className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Book Hotels</p>
                    <p className="text-xs text-muted-foreground">Find accommodation</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-4 space-y-5">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-[#d8fa3c]" />
              Trending Places
            </h2>
            
            {featuredLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-muted animate-pulse rounded-lg h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {featuredDestinations.slice(0, 6).map(place => (
                  <Card 
                    key={place.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleDestinationClick(place)}
                  >
                    <div className="relative h-24">
                      <img 
                        src={place.image_urls?.[0] || '/placeholder.svg'} 
                        alt={place.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-none">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {place.average_rating?.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1">{place.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {place.city}, {place.country}
                      </p>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          {place.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {place.total_reviews} reviews
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="text-center pt-4">
              <Button variant="outline" asChild className="border-[#95C11F] text-[#95C11F] hover:bg-[#95C11F]/10">
                <Link to="/discover">
                  Explore All Places
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="nearby" className="mt-4 space-y-3">
          <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg">
            <MapPinned className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-medium">Discover Nearby Places</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Find restaurants, cafes, hotels and more around your current location
            </p>
            <Button className="bg-[#95C11F] text-black hover:bg-[#c8e82c]" asChild>
              <Link to="/nearby-places">
                Explore Nearby Places
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
