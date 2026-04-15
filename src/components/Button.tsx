import React from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  gradient?: boolean;
  glow?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  gradient = true,
  glow = false,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-4 hover:-translate-y-0.5 hover:scale-105 active:scale-95',
    fullWidth && 'w-full',
    size === 'sm' && 'px-4 py-2 text-sm',
    size === 'md' && 'px-6 py-4 text-base',
    size === 'lg' && 'px-8 py-5 text-lg',
    disabled && 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:scale-100 active:scale-100',
    glow && 'shadow-lg hover:shadow-xl animate-pulse-glow',
    className
  );

  const variantClasses = cn(
    variant === 'primary' && gradient
      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-200'
      : variant === 'primary' && !gradient
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200'
      : variant === 'secondary'
      ? 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 focus:ring-white/30'
      : variant === 'ghost'
      ? 'bg-transparent text-white hover:bg-white/10 focus:ring-white/20'
      : variant === 'danger'
      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-200'
      : ''
  );

  return (
    <button
      className={cn(baseClasses, variantClasses)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;