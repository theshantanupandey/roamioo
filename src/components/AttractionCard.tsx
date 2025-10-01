
import { MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface AttractionCardProps {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  rating: number;
  category: string;
  distance?: string;
}

export function AttractionCard({
  id,
  name,
  location,
  description,
  image,
  rating,
  category,
  distance
}: AttractionCardProps) {
  const getCategoryColor = () => {
    switch (category.toLowerCase()) {
      case 'museum':
        return 'bg-wanderblue/10 text-wanderblue-dark';
      case 'restaurant':
        return 'bg-wandercoral/10 text-wandercoral-dark';
      case 'landmark':
        return 'bg-wandermint/10 text-wandermint-dark';
      case 'outdoor':
        return 'bg-wanderorange/10 text-wanderorange-dark';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden h-full card-hover">
      <div className="relative overflow-hidden">
        <AspectRatio ratio={16/9}>
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full"
          />
        </AspectRatio>
        <Badge className={`absolute top-3 right-3 ${getCategoryColor()}`}>
          {category}
        </Badge>
      </div>
      <CardContent className="pt-6">
        <h3 className="text-lg font-heading font-semibold mb-1">{name}</h3>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span>{location}</span>
          {distance && (
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {distance} away
            </span>
          )}
        </div>
        <div className="flex items-center mb-3">
          <div className="flex items-center bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500 mr-1" />
            <span className="font-medium">{rating.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {description}
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4 pb-4">
        <Button variant="outline" size="sm" className="w-full">
          Add to Itinerary
        </Button>
      </CardFooter>
    </Card>
  );
}
