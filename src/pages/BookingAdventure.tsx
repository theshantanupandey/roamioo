import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar, Clock, Users, MapPin, Star, DollarSign, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function BookingAdventure() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get sport data from navigation state
  const sport = location.state?.sport;
  
  const [formData, setFormData] = useState({
    participants: 1,
    date: '',
    time: '',
    specialRequests: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [step, setStep] = useState(1); // 1: Details, 2: Contact, 3: Payment

  if (!sport) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Adventure Not Found</h1>
          <p className="text-muted-foreground mb-4">Sorry, we couldn't find the adventure you're looking for.</p>
          <Button onClick={() => navigate('/adventure-sports')}>
            Back to Adventures
          </Button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleBooking = () => {
    toast({
      title: "Booking Confirmed!",
      description: `Your ${sport.name} adventure has been booked. You'll receive a confirmation email shortly.`,
    });
    navigate('/adventure-sports');
  };

  const totalPrice = sport.price * formData.participants;
  const tax = Math.round(totalPrice * 0.18); // 18% GST
  const finalPrice = totalPrice + tax;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Book Adventure</h1>
          <p className="text-muted-foreground">Complete your booking for {sport.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adventure Summary */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="relative h-24 w-24 rounded-lg overflow-hidden">
                  <img
                    src={sport.imageUrl}
                    alt={sport.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{sport.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {sport.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {sport.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {sport.rating} ({sport.reviews} reviews)
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{sport.description}</p>
                  <Badge variant="secondary">{sport.category}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Step {step} of 3: {step === 1 ? 'Booking Details' : step === 2 ? 'Contact Information' : 'Payment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="participants">Number of Participants</Label>
                      <Input
                        id="participants"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.participants}
                        onChange={(e) => handleInputChange('participants', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Preferred Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="time">Preferred Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special requirements or requests..."
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contactName">Full Name</Label>
                    <Input
                      id="contactName"
                      placeholder="Enter your full name"
                      value={formData.contactName}
                      onChange={(e) => handleInputChange('contactName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email Address</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Secure Payment
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is protected with 256-bit SSL encryption
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card className="p-4 cursor-pointer border-2 border-primary">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                          </div>
                        </div>
                      </Card>
                      <Card className="p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                          <div>
                            <p className="font-medium">UPI</p>
                            <p className="text-xs text-muted-foreground">Pay using UPI apps</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Ready to Book</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Click "Confirm Booking" to complete your adventure booking
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button variant="outline" onClick={handlePreviousStep}>
                    Previous
                  </Button>
                )}
                {step < 3 ? (
                  <Button 
                    onClick={handleNextStep}
                    className="ml-auto bg-primary hover:bg-primary/90"
                    disabled={
                      (step === 1 && (!formData.date || !formData.time)) ||
                      (step === 2 && (!formData.contactName || !formData.contactEmail || !formData.contactPhone))
                    }
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button 
                    onClick={handleBooking}
                    className="ml-auto bg-green-600 hover:bg-green-700"
                  >
                    Confirm Booking
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{sport.name}</span>
                  <span>₹{sport.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Participants</span>
                  <span>{formData.participants}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (18%)</span>
                  <span>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{finalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {formData.date && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Booking Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(formData.date).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    {formData.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>{formData.time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{formData.participants} participant{formData.participants > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>• Free cancellation up to 24 hours before the activity</p>
                <p>• All safety equipment included</p>
                <p>• Professional guide assistance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}