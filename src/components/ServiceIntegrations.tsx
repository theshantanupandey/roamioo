
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hotel, Car, Ambulance, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Service = 'hotels' | 'cabs' | 'emergency' | 'offers';

interface ServiceOption {
  id: string;
  name: string;
  description: string;
  price?: string;
  rating?: number;
  distance?: string;
  discount?: string;
  image?: string;
}

export function ServiceIntegrations() {
  const [activeService, setActiveService] = useState<Service>('hotels');

  // Mock data for demonstration purposes
  const serviceOptions: Record<Service, ServiceOption[]> = {
    hotels: [
      {
        id: '1',
        name: 'Grand Plaza Hotel',
        description: 'Luxury 5-star hotel with spa and rooftop pool',
        price: '$220/night',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8aG90ZWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60',
        discount: '15% off for trip members'
      },
      {
        id: '2',
        name: 'Riverside Inn',
        description: 'Boutique hotel with scenic river views',
        price: '$180/night',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGhvdGVsfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60',
        discount: '10% off for early booking'
      },
    ],
    cabs: [
      {
        id: '1',
        name: 'City Cabs',
        description: 'Reliable and affordable taxi service',
        price: 'From $15',
        rating: 4.3,
        image: 'https://images.unsplash.com/photo-1562888831-ca131260455d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8dGF4aXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
      },
      {
        id: '2',
        name: 'Luxury Rides',
        description: 'Premium car service with professional drivers',
        price: 'From $25',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1549371925-a40e44d20895?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNhYnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60'
      },
    ],
    emergency: [
      {
        id: '1',
        name: 'City Hospital',
        description: '24/7 emergency services available',
        distance: '1.2 miles away',
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aG9zcGl0YWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
      },
      {
        id: '2',
        name: 'Central Police Station',
        description: 'Law enforcement and emergency assistance',
        distance: '0.8 miles away',
        image: 'https://images.unsplash.com/photo-1566553464415-1a2bb156f54e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9saWNlfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60'
      },
    ],
    offers: [
      {
        id: '1',
        name: 'City Tour Package',
        description: '50% off on all-inclusive city tour packages',
        discount: '50% off',
        image: 'https://images.unsplash.com/photo-1569596082827-c5e8591a3c49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRvdXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60'
      },
      {
        id: '2',
        name: 'Restaurant Vouchers',
        description: 'Get $30 voucher for top-rated restaurants',
        discount: '$30 voucher',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHx8MA%3D&auto=format&fit=crop&w=500&q=60'
      },
    ],
  };

  const getServiceIcon = (service: Service) => {
    switch (service) {
      case 'hotels':
        return <Hotel className="h-5 w-5" />;
      case 'cabs':
        return <Car className="h-5 w-5" />;
      case 'emergency':
        return <Ambulance className="h-5 w-5" />;
      case 'offers':
        return <Gift className="h-5 w-5" />;
    }
  };

  const getServiceTitle = (service: Service) => {
    switch (service) {
      case 'hotels':
        return 'Hotel Bookings';
      case 'cabs':
        return 'Cab Services';
      case 'emergency':
        return 'Emergency Services';
      case 'offers':
        return 'Special Offers';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          {getServiceIcon(activeService)}
          <span className="ml-2">{getServiceTitle(activeService)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hotels" onValueChange={(value) => setActiveService(value as Service)}>
          <TabsList className="mb-4">
            <TabsTrigger value="hotels" className="flex items-center">
              <Hotel className="h-4 w-4 mr-1" /> Hotels
            </TabsTrigger>
            <TabsTrigger value="cabs" className="flex items-center">
              <Car className="h-4 w-4 mr-1" /> Cabs
            </TabsTrigger>
            <TabsTrigger value="emergency" className="flex items-center">
              <Ambulance className="h-4 w-4 mr-1" /> Emergency
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center">
              <Gift className="h-4 w-4 mr-1" /> Offers
            </TabsTrigger>
          </TabsList>

          {Object.entries(serviceOptions).map(([service, options]) => (
            <TabsContent key={service} value={service} className="space-y-4">
              {options.map((option) => (
                <div key={option.id} className="bg-white border rounded-lg overflow-hidden flex flex-col md:flex-row">
                  {option.image && (
                    <div className="w-full md:w-1/3 h-48 md:h-auto">
                      <img src={option.image} alt={option.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{option.name}</h3>
                      {option.rating && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                          ★ {option.rating}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{option.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {option.price && (
                        <Badge variant="outline" className="bg-slate-50">
                          {option.price}
                        </Badge>
                      )}
                      {option.distance && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                          {option.distance}
                        </Badge>
                      )}
                      {option.discount && (
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          {option.discount}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button className="bg-wanderblue hover:bg-wanderblue-dark">
                        {service === 'hotels' ? 'Book Now' : 
                         service === 'cabs' ? 'Reserve' : 
                         service === 'emergency' ? 'Contact' : 'Claim Offer'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
