 // dashboard/settings/user/page.tsx
 "use client";

  import { useState } from "react";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
  import { Button } from "@/app/components/ui/button";
  import { Input } from "@/app/components/ui/input";
  import { Label } from "@/app/components/ui/label";
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
      </div>
    );
  }
