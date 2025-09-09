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
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Perfil de usuario</h2>
        <p className="text-muted-foreground text-sm">
          Gestiona tu información personal, preferencias y configuración de seguridad.
        </p>
      </div>

      {/* Información del perfil */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>Información personal</span>
          </CardTitle>
          <CardDescription>Tu información básica y avatar del perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">MG</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" className="rounded-xl" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Cambiar foto
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG o GIF. Máximo 2MB.</p>
            </div>
          </div>

          <Separator />

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleChange();
                }}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value="maria@heladeriabrumazul.com" disabled className="rounded-xl bg-muted/50" />
            </div>
          </div>

          {/* Idioma de la interfaz */}
          <div className="space-y-2">
            <Label>Idioma de la interfaz</Label>
            <Select
              value={language}
              onValueChange={(value) => {
                setLanguage(value);
                handleChange();
              }}
            >
              <SelectTrigger className="rounded-xl max-w-xs">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="pt">🇵🇹 Português</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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

      {/* Seguridad */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Seguridad</span>
          </CardTitle>
          <CardDescription>Configuración de seguridad y acceso a tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div className="space-y-1">
              <Label className="font-medium">Contraseña</Label>
              <p className="text-sm text-muted-foreground">Última actualización hace 3 meses</p>
            </div>
            <Button variant="outline" className="rounded-xl" disabled>
              Cambiar contraseña
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Label className="font-medium">Autenticación de dos factores (2FA)</Label>
                <Badge variant="secondary">Próximamente</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
            </div>
            <Button variant="outline" className="rounded-xl" disabled>
              Configurar 2FA
            </Button>
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
