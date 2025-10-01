
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createFeaturedDestinations } from '@/utils/createFeaturedDestinations';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus } from 'lucide-react';

export function FeaturedDestinationsInit() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateDestinations = async () => {
    try {
      setIsCreating(true);
      await createFeaturedDestinations();
      toast({
        title: 'Featured destinations created!',
        description: 'Five beautiful destinations have been added to showcase on the homepage.',
      });
    } catch (error) {
      console.error('Error creating destinations:', error);
      toast({
        title: 'Error creating destinations',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <MapPin className="h-12 w-12 text-[#95C11F] mx-auto mb-2" />
        <CardTitle>Initialize Featured Destinations</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground text-sm">
          Create beautiful featured destinations to showcase on your homepage.
        </p>
        <Button 
          onClick={handleCreateDestinations}
          disabled={isCreating}
          className="bg-[#95C11F] text-black hover:bg-[#7a9e19] w-full"
        >
          {isCreating ? (
            'Creating...'
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Featured Destinations
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
