
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailConfirmation() {
  const navigate = useNavigate();
  
  // Redirect to login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="rounded-full bg-[#BFF627] p-4 w-16 h-16 mx-auto flex items-center justify-center">
          <Check className="h-8 w-8 text-black" />
        </div>
        
        <h1 className="text-2xl font-bold">Email Verified!</h1>
        
        <p className="text-muted-foreground">
          Your email has been successfully verified. You'll be redirected to the sign in page in a few seconds.
        </p>
        
        <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
          <div className="h-full bg-[#BFF627] animate-progress"></div>
        </div>
        
        <div className="pt-4">
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Click here if not redirected automatically
            </Button>
          </Link>
        </div>
        
        <div className="pt-8 text-center text-xs text-muted-foreground">
          <Mail className="inline-block mr-1 h-3 w-3" />
          <span>Check your email inbox for future updates</span>
        </div>
      </div>
    </div>
  );
}
