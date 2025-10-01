
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItemProps {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItemProps[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <ShadcnBreadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center hover:text-primary">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbSeparator />
            {item.href ? (
              <BreadcrumbLink asChild>
                <Link to={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </ShadcnBreadcrumb>
  );
}
