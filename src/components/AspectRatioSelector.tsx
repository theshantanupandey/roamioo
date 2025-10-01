
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Square, Crop } from 'lucide-react';

interface AspectRatioOption {
  label: string;
  ratio: number;
  icon: React.ReactNode;
}

interface AspectRatioSelectorProps {
  selectedRatio: number;
  onRatioChange: (ratio: number) => void;
  className?: string;
}

const aspectRatioOptions: AspectRatioOption[] = [
  { label: 'Original', ratio: 0, icon: <Crop className="h-4 w-4" /> },
  { label: '1:1', ratio: 1, icon: <Square className="h-4 w-4" /> },
  { label: '4:5', ratio: 4/5, icon: <div className="w-3 h-4 border border-current" /> },
  { label: '16:9', ratio: 16/9, icon: <div className="w-4 h-2 border border-current" /> },
];

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedRatio,
  onRatioChange,
  className
}) => {
  return (
    <div className={cn("flex gap-2", className)}>
      {aspectRatioOptions.map((option) => (
        <Button
          key={option.label}
          variant={selectedRatio === option.ratio ? "default" : "outline"}
          size="sm"
          onClick={() => onRatioChange(option.ratio)}
          className="flex items-center gap-1"
        >
          {option.icon}
          <span className="text-xs">{option.label}</span>
        </Button>
      ))}
    </div>
  );
};
