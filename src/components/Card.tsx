import React from 'react';
import { cn } from '../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 transition-all duration-300 ease-out',
        glow && 'shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:border-blue-500/50',
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="text-xl font-bold text-white mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;