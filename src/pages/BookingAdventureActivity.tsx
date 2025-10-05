import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, Star, ArrowLeft, Calendar as CalendarIcon, Clock, 
  Users, CheckCircle2, Shield, CreditCard, Building2, Phone, Mail 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';

interface Provider {
  id: string;
  name: string;
  rating: number;
  reviews: number;
  location: string;
  verified: boolean;
  responseTime: string;
  price: number;
  availability: string[];
  imageUrl: string;
  description: string;
  experience: string;
  languages: string[];
  groupSize: string;
  included: string[];
  contact: {
    phone: string;
    email: string;
  };
}

const BookingAdventureActivity = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  
  const activityData = location.state?.sport;
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [bookingStep, setBookingStep] = useState<'providers' | 'schedule' | 'payment'>('providers');

  // Mock providers - in real app, fetch from API/database
  const providers: Provider[] = [
    {
      id: '1',
      name: 'Adventure Seekers Co.',
      rating: 4.9,
      reviews: 342,
      location: activityData?.location || 'Various Locations',
      verified: true,
      responseTime: 'Within 1 hour',
      price: activityData?.price || 5000,
      availability: ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'],
      imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
      description: 'Leading adventure sports provider with 10+ years of experience',
      experience: '10+ years',
      languages: ['English', 'Hindi', 'Spanish'],
      groupSize: '1-8 people',
      included: ['Safety equipment', 'Professional guide', 'Insurance', 'Photos & videos', 'Refreshments'],
      contact: {
        phone: '+91 98765 43210',
        email: 'info@adventureseekers.com'
      }
    },
    {
      id: '2',
      name: 'Extreme Adventures Ltd.',
      rating: 4.7,
      reviews: 218,
      location: activityData?.location || 'Various Locations',
      verified: true,
      responseTime: 'Within 2 hours',
      price: (activityData?.price || 5000) * 0.9,
      availability: ['8:00 AM', '10:00 AM', '1:00 PM', '3:00 PM'],
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
      description: 'Certified professionals offering thrilling adventure experiences',
      experience: '8 years',
      languages: ['English', 'Hindi'],
      groupSize: '1-6 people',
      included: ['Safety gear', 'Expert instructor', 'Insurance', 'Certificate', 'Snacks'],
      contact: {
        phone: '+91 98123 45678',
        email: 'bookings@extremeadventures.com'
      }
    },
    {
      id: '3',
      name: 'Mountain Warriors',
      rating: 4.8,
      reviews: 156,
      location: activityData?.location || 'Various Locations',
      verified: false,
      responseTime: 'Within 4 hours',
      price: (activityData?.price || 5000) * 0.85,
      availability: ['7:00 AM', '9:00 AM', '12:00 PM', '3:00 PM'],
      imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
      description: 'Budget-friendly adventure sports with safety as priority',
      experience: '5 years',
      languages: ['English', 'Hindi', 'Marathi'],
      groupSize: '1-10 people',
      included: ['Basic equipment', 'Trained guide', 'First aid'],
      contact: {
        phone: '+91 97654 32109',
        email: 'contact@mountainwarriors.com'
      }
    }
  ];

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setBookingStep('schedule');
  };

  const handleScheduleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select both date and time",
        variant: "destructive"
      });
      return;
    }
    setBookingStep('payment');
  };

  const handlePayment = () => {
    toast({
      title: "Booking Confirmed!",
      description: `Your booking with ${selectedProvider?.name} has been confirmed for ${selectedDate?.toLocaleDateString()} at ${selectedTime}`,
    });
    setTimeout(() => navigate('/trips'), 2000);
  };

  const totalAmount = selectedProvider ? selectedProvider.price * numberOfPeople : 0;

  if (!activityData) {
    return (
      <div className="container p-4 pb-28 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Activity not found</h2>
          <Button onClick={() => navigate('/adventure-sports')} className="mt-4">
            Browse Activities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-4 pb-28 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => bookingStep === 'providers' ? navigate(-1) : setBookingStep(prev => prev === 'payment' ? 'schedule' : 'providers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{activityData.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{activityData.location}</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {bookingStep === 'providers' ? 'Select Provider' : bookingStep === 'schedule' ? 'Choose Schedule' : 'Payment'}
          </Badge>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex-1 h-1 rounded ${bookingStep === 'providers' ? 'bg-primary' : 'bg-primary'}`} />
        <div className={`flex-1 h-1 rounded ${bookingStep === 'schedule' || bookingStep === 'payment' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex-1 h-1 rounded ${bookingStep === 'payment' ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {/* Providers List */}
      {bookingStep === 'providers' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Third-Party Marketplace:</strong> These activities are offered by independent providers. 
              We connect you with verified and trusted adventure sports operators.
            </p>
          </div>

          <div className="space-y-4">
            {providers.map(provider => (
              <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="grid md:grid-cols-[200px_1fr] gap-4">
                  <div className="aspect-square md:aspect-auto bg-muted relative">
                    <img 
                      src={provider.imageUrl} 
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                    {provider.verified && (
                      <Badge className="absolute top-2 left-2 bg-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{provider.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{provider.rating}</span>
                            <span className="text-xs text-muted-foreground">({provider.reviews} reviews)</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{formatPrice(provider.price)}</div>
                          <div className="text-xs text-muted-foreground">per person</div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{provider.description}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Response: {provider.responseTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{provider.groupSize}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>{provider.experience}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {provider.included.slice(0, 3).map(item => (
                          <Badge key={item} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        className="w-full"
                        onClick={() => handleProviderSelect(provider)}
                      >
                        Select Provider
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Selection */}
      {bookingStep === 'schedule' && selectedProvider && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProvider.availability.map(time => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      onClick={() => setSelectedTime(time)}
                      className="w-full"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Number of People
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                  >
                    -
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{numberOfPeople}</span>
                  <Button
                    variant="outline"
                    onClick={() => setNumberOfPeople(Math.min(10, numberOfPeople + 1))}
                  >
                    +
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Provider:</span>
                  <span className="font-medium">{selectedProvider.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Date:</span>
                  <span className="font-medium">
                    {selectedDate ? selectedDate.toLocaleDateString() : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time:</span>
                  <span className="font-medium">{selectedTime || 'Not selected'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>People:</span>
                  <span className="font-medium">{numberOfPeople}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-lg text-primary">{formatPrice(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleScheduleConfirm}
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      )}

      {/* Payment */}
      {bookingStep === 'payment' && selectedProvider && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <img 
                  src={selectedProvider.imageUrl} 
                  alt={selectedProvider.name}
                  className="w-20 h-20 rounded object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedProvider.name}</h3>
                  <p className="text-sm text-muted-foreground">{activityData.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{selectedProvider.rating} ({selectedProvider.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">People:</span>
                  <span className="font-medium">{numberOfPeople}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per person:</span>
                  <span className="font-medium">{formatPrice(selectedProvider.price)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">{formatPrice(totalAmount)}</span>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">What's Included:</h4>
                <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                  {selectedProvider.included.map(item => (
                    <li key={item} className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                  <strong>Secure Payment Processing:</strong> Your payment will be processed securely. 
                  The provider will receive payment only after successful booking confirmation.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>SSL Encrypted Transaction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Secure Payment Gateway</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Provider Contact:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{selectedProvider.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{selectedProvider.contact.email}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Proceed to Payment - {formatPrice(totalAmount)}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By proceeding, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BookingAdventureActivity;
