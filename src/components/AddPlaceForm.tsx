
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Store, Coffee, Hotel, MapPin, X, Image } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';

// Define the form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Place name is required" }),
  type: z.enum(["restaurant", "cafe", "hotel", "shop", "scenic"], {
    required_error: "Please select a place type",
  }),
  address: z.string().min(2, { message: "Address is required" }),
  description: z.string().optional(),
  lat: z.number().or(z.string().transform(val => parseFloat(val))),
  lng: z.number().or(z.string().transform(val => parseFloat(val))),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddPlaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlace: (place: any) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  restaurant: <Store className="h-5 w-5" />,
  cafe: <Coffee className="h-5 w-5" />,
  hotel: <Hotel className="h-5 w-5" />,
  shop: <Store className="h-5 w-5" />,
  scenic: <MapPin className="h-5 w-5" />,
};

export const AddPlaceForm: React.FC<AddPlaceFormProps> = ({ open, onOpenChange, onAddPlace }) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'restaurant',
      address: '',
      description: '',
      lat: 37.7749,
      lng: -122.4194,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', // Default image
    },
  });

  const onSubmit = (data: FormValues) => {
    // Create new place with form data and a generated ID
    const newPlace = {
      id: Date.now(),
      ...data,
      rating: 4.0,
      reviewCount: 0,
      distance: 'New',
    };
    
    onAddPlace(newPlace);
    toast({
      title: "Place added successfully",
      description: `${data.name} has been added to nearby places.`,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add a new place</SheetTitle>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mountain View Cafe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place type</FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      className="flex flex-wrap gap-3"
                    >
                      {Object.entries(typeIcons).map(([type, icon]) => (
                        <FormItem key={type} className="flex-1 min-w-[100px]">
                          <FormLabel className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 p-3 cursor-pointer hover:bg-accent ${field.value === type ? 'border-primary bg-accent' : 'border-muted'}`}>
                            <FormControl>
                              <RadioGroupItem value={type} className="sr-only" />
                            </FormControl>
                            {icon}
                            <span className="text-sm capitalize">{type}</span>
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Alpine Road" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe this place..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Image URL" {...field} />
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {field.value ? (
                          <img 
                            src={field.value} 
                            alt="Preview" 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Preview";
                            }}
                          />
                        ) : (
                          <Image className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </SheetClose>
              <Button type="submit">Add Place</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddPlaceForm;
