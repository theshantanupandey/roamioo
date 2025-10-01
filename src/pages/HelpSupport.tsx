import React, { useState, useEffect } from 'react';
import { ChevronLeft, HelpCircle, MessageSquare, FileText, ExternalLink, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export default function HelpSupport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('sort_order', { ascending: true });
          
        if (error) {
          console.error("Error fetching FAQs:", error);
          // Use default FAQs as fallback
          const defaultFaqs = [
            {
              id: '1',
              question: "How do I create a new trip?",
              answer: "To create a new trip, navigate to the Trips tab and tap on the '+' button. Fill in all required details about your trip including destination, dates, and budget.",
              sort_order: 1
            },
            {
              id: '2',
              question: "How do I add companions to my trip?",
              answer: "When creating or editing a trip, scroll down to the Trip Companions section and tap 'Add Companion'. Enter their name and email address to send them an invitation.",
              sort_order: 2
            },
            {
              id: '3',
              question: "Can I split expenses with my travel companions?",
              answer: "Yes! Go to the Expenses tab, add a new expense, and select which companions to split the cost with. The app will automatically calculate each person's share.",
              sort_order: 3
            },
            {
              id: '4',
              question: "How do I follow an influencer's travel path?",
              answer: "Navigate to the 'Follow Path' section from the home screen. Browse available paths from travel influencers and select one to view all their stops, recommendations and experiences.",
              sort_order: 4
            },
            {
              id: '5',
              question: "Can I use the app offline during my travels?",
              answer: "Yes, most features work offline. Your data will sync once you're back online. However, features like maps and real-time updates require an internet connection.",
              sort_order: 5
            }
          ];
          setFaqs(defaultFaqs);
        } else {
          setFaqs(data || []);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFAQs();
  }, []);
  
  const contactSupport = async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user.id,
            status: 'open',
            subject: 'Support Request',
            message: 'User requested support assistance via Help & Support page'
          });
          
        if (error) throw error;
        
        toast({
          title: "Support request sent",
          description: "Our team will get back to you within 24 hours."
        });
      } catch (error) {
        console.error("Error creating support ticket:", error);
        toast({
          title: "Error",
          description: "Failed to send support request. Please try again later.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Support request sent",
        description: "Our team will get back to you within 24 hours."
      });
    }
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/profile')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Help & Support</h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-4 flex flex-col items-center justify-center text-center gap-2 hover:bg-muted/50 cursor-pointer h-28"
            onClick={() => navigate('/messages')}
          >
            <MessageSquare className="h-6 w-6 text-wanderblue" />
            <p className="font-medium">Chat Support</p>
            <p className="text-xs text-muted-foreground">Talk to our team</p>
          </Card>
          
          <Card className="p-4 flex flex-col items-center justify-center text-center gap-2 hover:bg-muted/50 cursor-pointer h-28">
            <FileText className="h-6 w-6 text-wanderblue" />
            <p className="font-medium">Documentation</p>
            <p className="text-xs text-muted-foreground">Browse guides</p>
          </Card>
        </div>

        <section className="pt-2">
          <h2 className="text-lg font-semibold mb-3">Frequently Asked Questions</h2>
          
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="h-6 bg-muted/60 rounded w-3/4 mb-2"></div>
                  <div className="h-16 bg-muted/40 rounded"></div>
                </Card>
              ))}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={`item-${faq.id}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>
        
        <section className="pt-2">
          <h2 className="text-lg font-semibold mb-3">Contact Us</h2>
          
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted p-2 rounded-full">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Call Support</p>
                <p className="text-sm text-muted-foreground">+1 (888) 555-0123</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-muted p-2 rounded-full">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">help@tripd.com</p>
              </div>
            </div>
            
            <Button 
              onClick={contactSupport}
              className="w-full bg-wanderblue"
            >
              Submit Support Request
            </Button>
          </Card>
        </section>
        
        <section className="pt-2 pb-24">
          <Card className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Visit Our Website</h3>
                <p className="text-sm text-muted-foreground">For more information and resources</p>
              </div>
              <Button variant="ghost" size="icon">
                <ExternalLink className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
