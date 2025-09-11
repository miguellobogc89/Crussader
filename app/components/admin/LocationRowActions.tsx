// app/components/admin/LocationRowActions.tsx
"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/button";
import { EllipsisVertical, Settings, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export default function LocationRowActions({ locationId }: { locationId: string }) {
  const onConfigure = React.useCallback(() => {
    // TODO: navegación o modal
    console.log("configurar", locationId);
  }, [locationId]);

  const onDelete = React.useCallback(() => {
    // TODO: confirm + fetch delete
    console.log("eliminar", locationId);
  }, [locationId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <EllipsisVertical className="h-5 w-5" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onConfigure}>
          <Settings className="h-4 w-4 mr-2" /> Configurar
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
