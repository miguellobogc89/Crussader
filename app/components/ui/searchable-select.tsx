"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/app/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/app/components/ui/command";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";

export type Option = { id: string; name: string };

type Props = {
  value?: string | null;
  onChange: (id: string | undefined, option?: Option) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
  searchPlaceholder = "Buscar...",
  emptyText = "Sin resultados",
  disabled,
  loading,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className={`justify-between ${className ?? ""}`}
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </span>
          ) : selected ? (
            selected.name
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width]"
        align="start"
        side="bottom"
        sideOffset={4}
        onWheelCapture={(e) => e.stopPropagation()} // evita que el diálogo se trague el scroll
      >
        <Command shouldFilter>
          <CommandInput placeholder={searchPlaceholder} />
          {/* 👇 contenedor con altura máxima y overflow */}
          <CommandList className="max-h-72 overflow-y-auto overscroll-contain">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name} // usado para el filtrado en vivo
                  onSelect={() => {
                    onChange(o.id, o);
                    setOpen(false); // cerrar al seleccionar
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      value === o.id ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {o.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
