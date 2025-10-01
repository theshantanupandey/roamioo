
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'amber' | 'coral' | 'mint';
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  compact = false 
}) => {
  const colorClasses = {
    blue: 'text-wanderblue bg-wanderblue/10 border-wanderblue/20',
    amber: 'text-wanderorange bg-wanderorange/10 border-wanderorange/20',
    coral: 'text-wandercoral bg-wandercoral/10 border-wandercoral/20',
    mint: 'text-wandermint bg-wandermint/10 border-wandermint/20'
  };

  if (compact) {
    return (
      <Card className="bg-card border-border hover:shadow-md transition-shadow">
        <CardContent className="p-2 sm:p-3 text-center">
          <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg mb-1 sm:mb-2 ${colorClasses[color]}`}>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <div className="text-sm sm:text-lg font-bold text-card-foreground truncate">{value}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight break-words hyphens-auto">
            {title}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-card-foreground truncate">{value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground leading-tight break-words hyphens-auto">
              {title}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
