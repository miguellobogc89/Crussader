// app/dashboard/settings/general/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  User as UserIcon,
  Globe,
  AlertTriangle,
  Upload,
} from "lucide-react";

// 🔹 nuevo componente
import AccountPasswordCard from "@/app/components/settings/AccountPasswordCard";

type UserWire = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: "system_admin" | "org_admin" | "user" | "test";
  createdAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  isActive: boolean;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  deactivatedAt: string | null;
  loginCount: number;
  failedLoginCount: number;
  onboardingStatus: string;
  locale: string | null;
  timezone: string | null;
  marketingOptIn: boolean;
  notes: string | null;
  privacyAcceptedAt: string | null;
  termsAcceptedAt: string | null;
  account_id: string | null;
  updatedAt: string;
  uiTheme: "system" | "light" | "dark";
  pendingEmail: string | null;
  pendingEmailTokenExpiresAt: string | null;
};

type RoleMeta = {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
};

function getRoleMeta(role: UserWire["role"]): RoleMeta {
  if (role === "system_admin") {
    return { label: "Admin sistema", variant: "destructive" };
  }
  if (role === "org_admin") {
    return { label: "Admin organización", variant: "default" };
  }
  if (role === "test") {
    return { label: "Usuario test", variant: "outline" };
  }
  return { label: "Usuario", variant: "secondary" };
}

export default function GeneralSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [user, setUser] = useState<UserWire | null>(null);

  // formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [language, setLanguage] = useState("es");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [modified, setModified] = useState(false);
  const markModified = () => setModified(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/settings/user", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json?.ok) {
          if (!cancelled) {
            setError(json?.error || "Error al cargar el usuario");
          }
          return;
        }

        const data: UserWire = json.data;
        if (cancelled) return;

        setUser(data);

        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setAvatarUrl(data.image ?? null);

        // mapeo simple de locale → select
        const loc = data.locale ?? "es-ES";
        if (loc.startsWith("es")) setLanguage("es");
        else if (loc.startsWith("en")) setLanguage("en");
        else if (loc.startsWith("pt")) setLanguage("pt");
        else if (loc.startsWith("fr")) setLanguage("fr");
        else setLanguage("es");

        setModified(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Error inesperado");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!user) return;
    try {
      setSaving(true);
      setError(null);

      const localeToSend =
        language === "es"
          ? "es-ES"
          : language === "en"
          ? "en-US"
          : language === "pt"
          ? "pt-PT"
          : language === "fr"
          ? "fr-FR"
          : "es-ES";

      const body: any = {
        name,
        locale: localeToSend,
      };

      if (avatarUrl !== undefined) {
        body.image = avatarUrl;
      }

      const res = await fetch("/api/settings/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.error || "No se han podido guardar los cambios");
        return;
      }

      const updated: UserWire = json.data;
      setUser(updated);
      setModified(false);
    } catch (e: any) {
      setError(e?.message || "Error guardando cambios");
    } finally {
      setSaving(false);
    }
  }

  function getInitials() {
    const base = name || email || "";
    if (!base) return "U";
    const parts = base.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  }

  function handleChangeAvatarClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];

      // Aquí luego puedes subir el archivo a tu endpoint / S3 / etc.
      // De momento, usamos una URL temporal de objeto para que veas el preview.
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      markModified();
    };

    input.click();
  }

  const roleMeta = user ? getRoleMeta(user.role) : null;

  return (
    <div className="space-y-8">
      {/* Información personal */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <UserIcon className="h-5 w-5" />
              <span>Información personal</span>
            </CardTitle>
            <CardDescription>
              Tu información básica y avatar del perfil
            </CardDescription>
          </div>

          {user && roleMeta && (
            <Badge variant={roleMeta.variant} className="text-xs sm:text-sm">
              {roleMeta.label}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando usuario…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} />
                  ) : (
                    <AvatarImage src="/placeholder-avatar.jpg" />
                  )}
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    type="button"
                    onClick={handleChangeAvatarClick}
                    disabled={saving || loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Cambiar foto
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Selecciona una imagen desde tu dispositivo. Más adelante la
                    subiremos a almacenamiento permanente.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      markModified();
                    }}
                    disabled={loading || saving}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email ?? ""}
                    disabled
                    className="rounded-xl bg-muted/50"
                  />
                </div>
              </div>

              {/* Idioma de la interfaz */}
              <div className="space-y-2">
                <Label>Idioma de la interfaz</Label>
                <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 max-w-xs">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Se configurará aquí más adelante. De momento, el idioma se
                    gestiona automáticamente.
                  </span>
                </div>
              </div>

              {/* Guardar */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={handleSave}
                  disabled={!modified || saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Seguridad (nueva card como componente) */}
      <AccountPasswordCard />

      {/* Zona peligrosa / Eliminar cuenta */}
      <Card className="rounded-2xl shadow-sm border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Zona peligrosa</span>
          </CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan permanentemente a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-destructive/20">
            <div className="space-y-1">
              <Label className="font-medium text-destructive">
                Eliminar cuenta
              </Label>
              <p className="text-sm text-muted-foreground">
                (Mock) Elimina permanentemente tu cuenta y todos los datos
                asociados. Esta acción no se puede deshacer.
              </p>
            </div>
            <Button
              variant="destructive"
              className="rounded-xl w-full sm:w-auto"
              disabled
            >
              Eliminar cuenta...
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
