import * as React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const currentValue = value?.[0] ?? Number(min);
    const pct = ((currentValue - Number(min)) / (Number(max) - Number(min))) * 100;

    return (
      <div className={cn('relative flex w-full touch-none select-none items-center', className)}>
        <div className="relative h-2 w-full rounded-full bg-neutral-200">
          <div
            className="absolute h-full rounded-full bg-neutral-900"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          {...props}
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-neutral-900 bg-white shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 10px)` }}
        />
      </div>
    );
  }
);
Slider.displayName = 'Slider';

export { Slider };
