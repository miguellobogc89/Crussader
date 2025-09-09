"use client";

import { useState, KeyboardEvent } from "react";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ChipInput({ value, onChange, placeholder = "Añadir...", className }: ChipInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) addChip(inputValue);
        }}
        placeholder={placeholder}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((chip, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-3 pr-1 py-1 gap-2 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <span>{chip}</span>
              <button onClick={() => removeChip(index)} className="hover:bg-destructive/20 rounded-full p-0.5 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
