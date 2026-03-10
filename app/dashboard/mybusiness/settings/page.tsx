// app/dashboard/mybusiness/settings/page.tsx
"use client";

import {
  Briefcase,
  CalendarClock,
  Clock3,
  Cog,
  Layers3,
  MapPin,
  Plus,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCog,
  Users2,
  Wrench,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border bg-white shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function SoftStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function ServiceCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Limpieza dental</h3>
            <Badge variant="secondary" className="rounded-full">
              Activo
            </Badge>
            <Badge variant="outline" className="rounded-full">
              45 min
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Servicio orientado a higiene básica con buffers operativos configurables.
          </p>
        </div>

        <Button variant="outline" className="rounded-xl">
          Editar
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Empleado</p>
          <p className="mt-1 text-sm font-medium text-slate-900">Cualquier empleado</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Recursos</p>
          <p className="mt-1 text-sm font-medium text-slate-900">Sin recurso obligatorio</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Buffers</p>
          <p className="mt-1 text-sm font-medium text-slate-900">5 min antes · 5 min después</p>
        </div>
      </div>
    </div>
  );
}

function EmployeeCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">María López</h3>
            <Badge variant="secondary" className="rounded-full">
              Visible
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">Higienista · Clínica Centro</p>
        </div>

        <Button variant="outline" className="rounded-xl">
          Editar
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full">
          Lunes a viernes
        </Badge>
        <Badge variant="outline" className="rounded-full">
          09:00–14:00
        </Badge>
        <Badge variant="outline" className="rounded-full">
          16:00–19:00
        </Badge>
      </div>
    </div>
  );
}

function ResourceCard() {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Gabinete 2</h3>
            <Badge variant="secondary" className="rounded-full">
              Activo
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">Ubicación: Clínica Centro · Capacidad 1</p>
        </div>

        <Button variant="outline" className="rounded-xl">
          Editar
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full">
          Gabinete
        </Badge>
        <Badge variant="outline" className="rounded-full">
          Odontología
        </Badge>
      </div>
    </div>
  );
}

export default function MyBusinessSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[28px] border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-[0_22px_60px_rgba(15,23,42,0.28)]">
        <CardContent className="p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Configuración operativa para citas y disponibilidad
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  Ajustes del negocio y motor de agenda
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
                  Define cómo se prestan tus servicios, qué empleados pueden realizarlos, qué
                  recursos intervienen y cómo debe comportarse el sistema al calcular huecos libres.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="rounded-xl bg-white text-slate-900 hover:bg-slate-100">
                  Guardar cambios
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Vista previa de disponibilidad
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <SoftStat
                label="Servicios"
                value="12"
                hint="Con duraciones y reglas"
              />
              <SoftStat
                label="Empleados"
                value="8"
                hint="Visibles para agenda"
              />
              <SoftStat
                label="Recursos"
                value="5"
                hint="Bloqueables por cita"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="space-y-6">
        <div className="overflow-auto">
          <TabsList className="h-auto rounded-2xl border bg-white p-1 shadow-sm">
            <TabsTrigger value="services" className="rounded-xl px-4 py-2.5">
              <Stethoscope className="mr-2 h-4 w-4" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="employees" className="rounded-xl px-4 py-2.5">
              <Users2 className="mr-2 h-4 w-4" />
              Empleados
            </TabsTrigger>
            <TabsTrigger value="resources" className="rounded-xl px-4 py-2.5">
              <Wrench className="mr-2 h-4 w-4" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-xl px-4 py-2.5">
              <CalendarClock className="mr-2 h-4 w-4" />
              Disponibilidad
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-xl px-4 py-2.5">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Reglas
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="services" className="space-y-6">
          <Card className="rounded-[26px] border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Stethoscope className="h-5 w-5 text-slate-700" />}
                title="Configuración de servicios"
                description="Duración, buffers, dependencia de empleados, recursos y reglas de reserva."
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-slate-50/70 p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Listado de servicios</h3>
                        <p className="text-sm text-slate-600">
                          Mantén un catálogo claro para que el asistente pueda reservar con precisión.
                        </p>
                      </div>

                      <Button className="rounded-xl">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo servicio
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <ServiceCard />
                      <ServiceCard />
                    </div>
                  </div>
                </div>

                <Card className="rounded-2xl border shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Editor rápido</CardTitle>
                    <CardDescription>
                      Vista orientativa para configurar cómo debe comportarse un servicio.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label>Nombre del servicio</Label>
                      <Input placeholder="Ej. Limpieza dental" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Duración</Label>
                        <Input placeholder="45" />
                      </div>
                      <div className="space-y-2">
                        <Label>Buffer antes</Label>
                        <Input placeholder="5" />
                      </div>
                      <div className="space-y-2">
                        <Label>Buffer después</Label>
                        <Input placeholder="5" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Puede hacerlo cualquier empleado</p>
                          <p className="text-sm text-slate-500">
                            Útil para servicios simples donde no importa el rol concreto.
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <div className="space-y-2">
                        <Label>Rol requerido principal</Label>
                        <Select>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="higienista">Higienista</SelectItem>
                            <SelectItem value="odontologo">Odontólogo</SelectItem>
                            <SelectItem value="auxiliar">Auxiliar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Recurso requerido principal</Label>
                        <Select>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Selecciona un tipo de recurso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gabinete">Gabinete</SelectItem>
                            <SelectItem value="laser">Láser</SelectItem>
                            <SelectItem value="cabina">Cabina</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Permitir reserva por IA</p>
                          <p className="text-sm text-slate-500">
                            El asistente podrá proponer huecos y confirmar citas de este servicio.
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">Mostrar en canales públicos</p>
                          <p className="text-sm text-slate-500">
                            Visible en webchat, formularios o integraciones de agenda.
                          </p>
                        </div>
                        <Switch />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button className="w-full rounded-xl">Guardar servicio</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card className="rounded-[26px] border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<UserCog className="h-5 w-5 text-slate-700" />}
                title="Empleados y capacidad operativa"
                description="Configura visibilidad en agenda, roles, sedes y disponibilidad base del personal."
              />
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Equipo disponible</h3>
                    <p className="text-sm text-slate-600">
                      Estos empleados podrán entrar en el cálculo de disponibilidad.
                    </p>
                  </div>
                  <Button className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo empleado
                  </Button>
                </div>

                <div className="space-y-3">
                  <EmployeeCard />
                  <EmployeeCard />
                </div>
              </div>

              <Card className="rounded-2xl border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Ajustes rápidos de empleado</CardTitle>
                  <CardDescription>
                    Vista orientativa para editar roles, sedes visibles y comportamiento en agenda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input placeholder="Ej. María López" />
                  </div>

                  <div className="space-y-2">
                    <Label>Rol principal</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="higienista">Higienista</SelectItem>
                        <SelectItem value="odontologo">Odontólogo</SelectItem>
                        <SelectItem value="auxiliar">Auxiliar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sede principal</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona una sede" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="centro">Clínica Centro</SelectItem>
                        <SelectItem value="norte">Clínica Norte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Visible en agenda</p>
                        <p className="text-sm text-slate-500">Aparece como candidato en reservas.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border p-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">Permitir cruce entre sedes</p>
                        <p className="text-sm text-slate-500">Puede cubrir servicios fuera de su sede principal.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Button className="w-full rounded-xl">Guardar empleado</Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card className="rounded-[26px] border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Layers3 className="h-5 w-5 text-slate-700" />}
                title="Recursos y espacios"
                description="Gabinetes, cabinas, salas, máquinas o cualquier recurso que bloquee una cita."
              />
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Recursos configurados</h3>
                    <p className="text-sm text-slate-600">
                      El motor de agenda los usa para evitar dobles reservas.
                    </p>
                  </div>
                  <Button className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo recurso
                  </Button>
                </div>

                <div className="space-y-3">
                  <ResourceCard />
                  <ResourceCard />
                </div>
              </div>

              <Card className="rounded-2xl border shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">Editor rápido de recurso</CardTitle>
                  <CardDescription>
                    Define sede, tipo, capacidad y visibilidad del recurso.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Nombre del recurso</Label>
                    <Input placeholder="Ej. Gabinete 2" />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gabinete">Gabinete</SelectItem>
                        <SelectItem value="cabina">Cabina</SelectItem>
                        <SelectItem value="maquina">Máquina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Sede</Label>
                      <Select>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Selecciona una sede" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="centro">Clínica Centro</SelectItem>
                          <SelectItem value="norte">Clínica Norte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Capacidad</Label>
                      <Input placeholder="1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Activo para reservas</p>
                      <p className="text-sm text-slate-500">
                        El sistema podrá usarlo al buscar huecos disponibles.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Button className="w-full rounded-xl">Guardar recurso</Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <Card className="rounded-[26px] border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Clock3 className="h-5 w-5 text-slate-700" />}
                title="Disponibilidad y agenda"
                description="Cómo se construyen los huecos: horario de sede, turnos, bloqueos y capacidad operativa."
              />
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-slate-50/70 p-5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Horario de sede</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Define las ventanas base sobre las que después se cruzarán empleados, recursos y citas.
                </p>

                <div className="mt-4 space-y-3">
                  {[
                    "Lunes · 09:00–13:00 · 17:00–20:00",
                    "Martes · 09:00–13:00 · 17:00–20:00",
                    "Miércoles · 09:00–13:00 · 17:00–20:00",
                    "Jueves · 09:00–13:00 · 17:00–20:00",
                    "Viernes · 09:00–13:00 · 17:00–20:00",
                    "Sábado · 10:00–14:00",
                    "Domingo · Cerrado",
                  ].map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm"
                    >
                      <span className="text-slate-800">{row}</span>
                      <Button variant="ghost" size="sm" className="rounded-lg">
                        Editar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50/70 p-5">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Reglas de cálculo</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Configura el comportamiento futuro del motor de disponibilidad y del asistente.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Usar turnos de empleados</p>
                      <p className="text-sm text-slate-500">
                        Los huecos se apoyan en la agenda real del personal.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Bloquear por recursos</p>
                      <p className="text-sm text-slate-500">
                        Evita dobles reservas de gabinetes, cabinas o máquinas.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border bg-white p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Permitir sugerencias por IA</p>
                      <p className="text-sm text-slate-500">
                        El asistente podrá proponer el mejor día o tramo horario.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="rounded-2xl border bg-white p-4">
                    <Label className="mb-2 block">Granularidad base de slots</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Selecciona una granularidad" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card className="rounded-[26px] border bg-white shadow-sm">
            <CardHeader className="pb-3">
              <SectionHeader
                icon={<Cog className="h-5 w-5 text-slate-700" />}
                title="Reglas operativas del negocio"
                description="Preferencias generales para reservas, cancelaciones, modificaciones y comportamiento del asistente."
              />
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Permitir cancelación por IA</p>
                    <p className="text-sm text-slate-500">El asistente podrá cancelar citas directamente.</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Pedir motivo de cancelación</p>
                    <p className="text-sm text-slate-500">
                      Solicita un motivo opcional tras cancelar la cita.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Permitir cambios de cita por IA</p>
                    <p className="text-sm text-slate-500">
                      El asistente podrá buscar alternativas y modificar reservas.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border p-4">
                  <Label className="mb-2 block">Antelación mínima para reservar</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona un margen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin margen</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                      <SelectItem value="1440">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border p-4">
                  <Label className="mb-2 block">Ventana máxima de reserva</Label>
                  <Select>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Selecciona una ventana" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 días</SelectItem>
                      <SelectItem value="15">15 días</SelectItem>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="60">60 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border p-4">
                  <Label className="mb-2 block">Mensaje interno para el asistente</Label>
                  <Input placeholder="Ej. Priorizar huecos agrupados por la tarde cuando sea posible" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}