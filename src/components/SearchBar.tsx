
import { useState, useEffect } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  isActive?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ 
  placeholder = "Search...", 
  value = "", 
  onChange, 
  onSearch,
  className,
  isActive = false,
  onActivate,
  onDeactivate,
  autoFocus = false
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  
  // Sync with parent component
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onChange(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative flex w-full items-center">
        {isActive && onDeactivate && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={onDeactivate}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={handleChange}
            placeholder={placeholder}
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
            suffix={
              searchTerm ? (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0" 
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null
            }
            readOnly={!isActive}
            onClick={!isActive && onActivate ? onActivate : undefined}
            autoFocus={autoFocus && isActive}
          />
        </div>
      </div>
    </form>
  );
}
