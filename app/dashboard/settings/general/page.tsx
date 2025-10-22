"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { User as UserIcon, Upload, Globe, Palette, Shield, AlertTriangle } from "lucide-react";

export default function UserPage() {
  const [language, setLanguage] = useState("es");
  const [theme, setTheme] = useState("system");
  const [name, setName] = useState("María González");

  // Si luego usas footer global de “Guardar cambios”, puedes levantar este estado a un store
  const [modified, setModified] = useState(false);
  const handleChange = () => setModified(true);

  return (
    <div className="space-y-8">

      {/* Apariencia */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Apariencia</span>
          </CardTitle>
          <CardDescription>Personaliza el tema y la apariencia de la interfaz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label className="text-base">Tema de color</Label>
            <RadioGroup
              value={theme}
              onValueChange={(value) => {
                setTheme(value);
                handleChange();
              }}
            >
              <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="light" id="light" className="mt-1" />
                <div className="space-y-2">
                  <Label htmlFor="light" className="font-medium cursor-pointer">
                    Modo claro
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Interfaz clara y brillante, ideal para uso diurno
                  </p>
                </div>
                <div className="ml-auto">
                  <div className="h-12 w-16 rounded-lg bg-white border-2 shadow-sm" />
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="dark" id="dark" className="mt-1" />
                <div className="space-y-2">
                  <Label htmlFor="dark" className="font-medium cursor-pointer">
                    Modo oscuro
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Interfaz oscura, reduce la fatiga ocular en ambientes con poca luz
                  </p>
                </div>
                <div className="ml-auto">
                  <div className="h-12 w-16 rounded-lg bg-gray-900 border-2 shadow-sm" />
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="system" id="system" className="mt-1" />
                <div className="space-y-2">
                  <Label htmlFor="system" className="font-medium cursor-pointer">
                    Automático (sistema)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Se adapta automáticamente según la configuración de tu dispositivo
                  </p>
                </div>
                <div className="ml-auto">
                  <div className="h-12 w-16 rounded-lg bg-gradient-to-r from-white to-gray-900 border-2 shadow-sm" />
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Zona peligrosa */}
      <Card className="rounded-2xl shadow-sm border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Zona peligrosa</span>
          </CardTitle>
          <CardDescription>Acciones irreversibles que afectan permanentemente a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20">
            <div className="space-y-1">
              <Label className="font-medium text-destructive">Eliminar cuenta</Label>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente tu cuenta y todos los datos asociados. Esta acción no se puede deshacer.
              </p>
            </div>
            <Button variant="destructive" className="rounded-xl" disabled>
              Eliminar cuenta...
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
