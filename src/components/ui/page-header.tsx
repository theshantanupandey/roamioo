
import React from 'react';

interface PageHeaderProps {
  heading: string;
  subheading?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ 
  heading, 
  subheading, 
  icon,
  actions
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          {subheading && (
            <p className="text-sm text-muted-foreground">{subheading}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
