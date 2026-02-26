// app/components/admin/integrations/whatsapp/templates/TemplatesAddDialog.tsx
"use client";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Plus } from "lucide-react";

export default function TemplatesAddDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Añadir
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir plantilla (mock)</DialogTitle>
          <DialogDescription>
            En MVP: tú las creas en Meta. Aquí luego conectaremos la sincronización / alta manual.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">Este modal es solo diseño por ahora.</div>

        <DialogFooter>
          <Button variant="secondary">Cerrar</Button>
          <Button disabled>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}