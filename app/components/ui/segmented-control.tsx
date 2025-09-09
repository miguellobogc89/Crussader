"use client";

import { cn } from "@/lib/utils";

interface SegmentedOption {
  value: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex bg-muted/50 p-1 rounded-lg", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2",
            value === option.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          {option.icon && <span>{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
}
