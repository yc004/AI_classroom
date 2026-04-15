import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10',
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
