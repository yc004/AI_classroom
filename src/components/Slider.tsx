import React from 'react';
import { cn } from '../lib/utils';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  fullWidth?: boolean;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value = 50,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  fullWidth = false,
  className,
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-semibold text-white mb-2">
            {label}
          </label>
          {showValue && (
            <span className="text-sm font-medium text-white/80">
              {value}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        className={cn(
          'w-full h-2 rounded-full bg-white/10 appearance-none cursor-pointer transition-all duration-300',
          fullWidth && 'w-full',
          className
        )}
        style={{
          background: `linear-gradient(to right, #165DFF 0%, #165DFF ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
        }}
        min={min}
        max={max}
        step={step}
        value={value}
        {...props}
      />
    </div>
  );
};

export default Slider;