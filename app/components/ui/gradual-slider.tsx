"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SliderOption {
  value: number;
  label: string;
  emoji: string;
}

interface GradualSliderProps {
  value: number;
  onChange: (value: number) => void;
  options: SliderOption[];
  gradient: string;
  className?: string;
}

export function GradualSlider({ value, onChange, options, gradient, className }: GradualSliderProps) {
  const [isHovering, setIsHovering] = useState(false);

  const currentOption = options.find(opt => opt.value === value) || options[0];
  const minValue = Math.min(...options.map(opt => opt.value));
  const maxValue = Math.max(...options.map(opt => opt.value));
  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative" onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
        <div className="h-2 rounded-full bg-gradient-to-r from-muted to-muted relative overflow-hidden">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-300", gradient, isHovering && "shadow-lg")}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary shadow-md transition-all duration-200 flex items-center justify-center text-xs",
            isHovering && "scale-110 shadow-lg"
          )}
          style={{ left: `calc(${percentage}% - 12px)` }}
        >
          {currentOption.emoji}
        </div>

        <input
          type="range"
          min={minValue}
          max={maxValue}
          step={1}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex justify-between mt-2">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "text-xs px-2 py-1 rounded transition-all duration-200 hover:bg-primary/10",
                value === option.value ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <span>{option.emoji}</span>
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className={cn("px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary transition-all duration-200", isHovering && "bg-primary/20")}>
          {currentOption.emoji} {currentOption.label}
        </div>
      </div>
    </div>
  );
}
