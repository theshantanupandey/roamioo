import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Search, Filter, Calendar, Users, Clock, Mountain, Waves, Wind, Compass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';

interface AdventureSport {
  id: string;
  name: string;
  location: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category: string;
  price: number;
  duration: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  available: boolean;
}

const mockAdventureSports: AdventureSport[] = [
  {
    id: '1',
    name: 'Bungee Jumping',
    location: 'Queenstown, New Zealand',
    description: 'Experience the ultimate adrenaline rush with a 134m bungee jump over the stunning Kawarau River.',
    difficulty: 'Intermediate',
    category: 'Extreme',
    price: 12990,
    duration: '2 hours',
    rating: 4.8,
    reviews: 2847,
    imageUrl: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=800&auto=format&fit=crop',
    available: true
  },
  {
    id: '2',
    name: 'White Water Rafting',
    location: 'Rishikesh, India',
    description: 'Navigate through Class IV rapids in one of the most scenic river canyons in the Himalayas.',
    difficulty: 'Advanced',
    category: 'Water Sports',
    price: 8900,
    duration: '6 hours',
    rating: 4.7,
    reviews: 1924,
    imageUrl: 'https://images.unsplash.com/photo-1629248564797-8c5ba85da9d3?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    available: true
  },
  {
    id: '3',
    name: 'Rock Climbing',
    location: 'Manali, India',
    description: 'Scale the majestic mountain walls with expert guides and top-quality equipment.',
    difficulty: 'Beginner',
    category: 'Climbing',
    price: 6500,
    duration: '4 hours',
    rating: 4.9,
    reviews: 3156,
    imageUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&auto=format&fit=crop',
    available: true
  },
  {
    id: '4',
    name: 'Paragliding',
    location: 'Bir Billing, India',
    description: 'Soar above the Himalayas with breathtaking views of snow-capped peaks and valleys.',
    difficulty: 'Intermediate',
    category: 'Air Sports',
    price: 4500,
    duration: '3 hours',
    rating: 4.6,
    reviews: 892,
    imageUrl: 'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?w=800&auto=format&fit=crop',
    available: true
  },
  {
    id: '5',
    name: 'Skydiving',
    location: 'Mysore, India',
    description: 'Tandem skydive with spectacular views of Karnataka countryside.',
    difficulty: 'Expert',
    category: 'Air Sports',
    price: 35000,
    duration: '4 hours',
    rating: 4.9,
    reviews: 4521,
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop',
    available: true
  },
  {
    id: '6',
    name: 'Scuba Diving',
    location: 'Andaman Islands, India',
    description: 'Explore the underwater coral reefs and marine life in crystal clear waters.',
    difficulty: 'Advanced',
    category: 'Water Sports',
    price: 8500,
    duration: '8 hours',
    rating: 4.5,
    reviews: 1567,
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop',
    available: true
  }
];

const categories = ['All', 'Extreme', 'Water Sports', 'Climbing', 'Air Sports'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

const AdventureSports = () => {
  const [sports, setSports] = useState<AdventureSport[]>(mockAdventureSports);
  const [filteredSports, setFilteredSports] = useState<AdventureSport[]>(mockAdventureSports);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    filterSports();
  }, [searchTerm, selectedCategory, selectedDifficulty, sports]);

  const filterSports = () => {
    let filtered = sports;

    if (searchTerm) {
      filtered = filtered.filter(sport =>
        sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sport.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sport.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(sport => sport.category === selectedCategory);
    }

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter(sport => sport.difficulty === selectedDifficulty);
    }

    setFilteredSports(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-orange-100 text-orange-800';
      case 'Expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Extreme': return <Mountain className="h-4 w-4" />;
      case 'Water Sports': return <Waves className="h-4 w-4" />;
      case 'Air Sports': return <Wind className="h-4 w-4" />;
      case 'Climbing': return <Mountain className="h-4 w-4" />;
      default: return <Compass className="h-4 w-4" />;
    }
  };

  const handleBookActivity = (sport: AdventureSport) => {
    // Navigate to a proper booking flow
    navigate(`/booking/adventure/${sport.id}`, { 
      state: { 
        sport,
        from: 'adventure-sports'
      }
    });
  };

  return (
    <div className="container mx-auto p-4 pb-20 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              Adventure Sports
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover thrilling activities and extreme sports around the world
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/booked-activities')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            My Bookings
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities, locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Category:</span>
          </div>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>

      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredSports.length} adventure{filteredSports.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Sports Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-3" />
                <div className="h-3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSports.map(sport => (
            <Card key={sport.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full">
              <div className="relative aspect-[4/3] bg-muted">
                <img
                  src={sport.imageUrl}
                  alt={sport.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="absolute top-3 right-3">
                  <Badge className={getDifficultyColor(sport.difficulty)}>
                    {sport.difficulty}
                  </Badge>
                </div>
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                    {getCategoryIcon(sport.category)}
                    <span className="ml-1">{sport.category}</span>
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 flex flex-col justify-between flex-grow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg leading-tight">{sport.name}</h3>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{sport.rating}</span>
                      <span className="text-xs text-muted-foreground">({sport.reviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{sport.location}</span>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {sport.description}
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between text-sm border-t pt-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{sport.duration}</span>
                    </div>
                    <div className="flex items-center font-semibold text-lg text-primary">
                      <span>{formatPrice(sport.price)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-11 bg-primary hover:bg-primary/90 font-medium"
                    onClick={() => handleBookActivity(sport)}
                    disabled={!sport.available}
                  >
                    {sport.available ? 'Book Activity' : 'Unavailable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No adventures found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search criteria or filters
          </p>
        </div>
      )}
    </div>
  );
};

export default AdventureSports;