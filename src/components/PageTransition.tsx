import React from 'react';
import { cn } from '../lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'animate-fade-in-up',
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
