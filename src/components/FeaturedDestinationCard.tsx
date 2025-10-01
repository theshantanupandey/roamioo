
import React from 'react';
import { Card } from '@/components/ui/card';
import { Star, MapPin } from 'lucide-react';

interface FeaturedDestinationCardProps {
  id: string;
  name: string;
  city: string;
  country: string;
  image_url: string;
  average_rating: number;
  total_reviews: number;
  category: string;
  onClick: () => void;
}

export const FeaturedDestinationCard: React.FC<FeaturedDestinationCardProps> = ({
  name,
  city,
  country,
  image_url,
  average_rating,
  total_reviews,
  category,
  onClick
}) => {
  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 min-w-[150px] md:min-w-0"
      onClick={onClick}
    >
      <div className="aspect-[3/4] relative">
        <img 
          src={image_url || '/placeholder.svg'} 
          alt={name}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Rating badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs flex items-center font-medium">
          <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400 mr-1" />
          {average_rating.toFixed(1)}
        </div>
        
        {/* Category badge */}
        <div className="absolute top-3 left-3 bg-[#95C11F]/90 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs font-medium capitalize">
          {category}
        </div>
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight">{name}</h3>
          <div className="flex items-center text-xs opacity-90 mb-1">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{city}, {country}</span>
          </div>
          <div className="text-xs opacity-75">
            {total_reviews} reviews
          </div>
        </div>
      </div>
    </Card>
  );
};
