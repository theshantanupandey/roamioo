
import React from 'react';
import { StatCard } from '@/components/StatCard';
import { useDevice } from '@/hooks/use-device';
import { LucideIcon } from 'lucide-react';

interface StatsGridProps {
  stats: {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'blue' | 'coral' | 'mint' | 'amber';
  }[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  const { isMobile } = useDevice();
  
  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color || 'blue'}
        />
      ))}
    </div>
  );
}
