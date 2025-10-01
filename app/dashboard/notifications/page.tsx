"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Check, CheckCheck, Star, CreditCard, Settings as SettingsIcon, Package, Bot } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationCategory = "all" | "agent" | "reviews" | "billing" | "system" | "integrations";

interface Notification {
  id: string;
  category: NotificationCategory;
  type:
    | "agent-action"
    | "agent-booking"
    | "review-new"
    | "review-response"
    | "billing-payment"
    | "billing-subscription"
    | "system-update"
    | "system-alert"
    | "integration-connected"
    | "integration-error";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority?: "low" | "medium" | "high";
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    category: "billing",
    type: "billing-subscription",
    title: "Suscripción renovada automáticamente",
    description: "Tu suscripción Premium se ha renovado correctamente por $29.99/mes",
    timestamp: "Hace 5 minutos",
    read: false,
    priority: "medium",
  },
  {
    id: "2",
    category: "reviews",
    type: "review-new",
    title: "Nueva reseña de 5 estrellas",
    description: "María López: 'Excelente servicio, muy profesional y atento'",
    timestamp: "Hace 1 hora",
    read: false,
    priority: "high",
  },
  {
    id: "3",
    category: "agent",
    type: "agent-booking",
    title: "El agente confirmó una nueva cita",
    description: "Cita agendada con Juan Pérez para mañana a las 10:00 AM",
    timestamp: "Hace 2 horas",
    read: false,
    priority: "high",
  },
  {
    id: "4",
    category: "agent",
    type: "agent-action",
    title: "El agente respondió a una consulta",
    description: "Respuesta automática enviada a info@cliente.com sobre disponibilidad",
    timestamp: "Hace 3 horas",
    read: true,
    priority: "low",
  },
  {
    id: "5",
    category: "reviews",
    type: "review-new",
    title: "Nueva reseña recibida",
    description: "Carlos Ruiz te ha dejado una reseña de 4 estrellas",
    timestamp: "Hace 4 horas",
    read: true,
    priority: "medium",
  },
  {
    id: "6",
    category: "system",
    type: "system-update",
    title: "Actualización del sistema completada",
    description: "Nueva versión 2.1.0 con mejoras de rendimiento y nuevas funcionalidades",
    timestamp: "Hace 5 horas",
    read: true,
    priority: "low",
  },
  {
    id: "7",
    category: "integrations",
    type: "integration-connected",
    title: "Google Calendar conectado exitosamente",
    description: "Tus citas ahora se sincronizarán automáticamente con Google Calendar",
    timestamp: "Hace 6 horas",
    read: true,
    priority: "medium",
  },
  {
    id: "8",
    category: "agent",
    type: "agent-booking",
    title: "El agente canceló una cita",
    description: "Cita del viernes cancelada por solicitud del cliente",
    timestamp: "Hace 8 horas",
    read: true,
    priority: "medium",
  },
  {
    id: "9",
    category: "billing",
    type: "billing-payment",
    title: "Pago procesado correctamente",
    description: "Se ha recibido el pago de $150.00 por servicios del mes de octubre",
    timestamp: "Ayer",
    read: true,
    priority: "medium",
  },
  {
    id: "10",
    category: "reviews",
    type: "review-response",
    title: "Tu respuesta fue publicada",
    description: "Tu respuesta a la reseña de Ana Martínez ya está visible",
    timestamp: "Ayer",
    read: true,
    priority: "low",
  },
  {
    id: "11",
    category: "system",
    type: "system-alert",
    title: "Mantenimiento programado",
    description: "Mantenimiento del sistema el próximo domingo de 2:00 AM a 4:00 AM",
    timestamp: "Hace 2 días",
    read: true,
    priority: "medium",
  },
  {
    id: "12",
    category: "integrations",
    type: "integration-error",
    title: "Error de sincronización",
    description: "No se pudo sincronizar con Stripe. Verifica tu configuración",
    timestamp: "Hace 2 días",
    read: false,
    priority: "high",
  },
];

const categoryConfig: Record<
  NotificationCategory,
  { label: string; icon: LucideIcon; color: string; bgColor: string }
> = {
  all: {
    label: "Todas",
    icon: Bell,
    color: "text-foreground",
    bgColor: "bg-primary/10 hover:bg-primary/20 border-primary/30",
  },
  agent: {
    label: "Agente IA",
    icon: Bot,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
  },
  reviews: {
    label: "Reseñas",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30",
  },
  billing: {
    label: "Facturación",
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/30",
  },
  system: {
    label: "Sistema",
    icon: SettingsIcon,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30",
  },
  integrations: {
    label: "Integraciones",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30",
  },
};

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "agent-action":
    case "agent-booking":
      return <Bot className="w-5 h-5" />;
    case "review-new":
    case "review-response":
      return <Star className="w-5 h-5" />;
    case "billing-payment":
    case "billing-subscription":
      return <CreditCard className="w-5 h-5" />;
    case "system-update":
    case "system-alert":
      return <SettingsIcon className="w-5 h-5" />;
    case "integration-connected":
    case "integration-error":
      return <Package className="w-5 h-5" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

function getNotificationColor(category: NotificationCategory) {
  switch (category) {
    case "agent":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "reviews":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "billing":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "system":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "integrations":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const filteredNotifications = notifications
    .filter((n) => (showOnlyUnread ? !n.read : true))
    .filter((n) => (categoryFilter === "all" ? true : n.category === categoryFilter));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryCount = (category: NotificationCategory) => {
    if (category === "all") return notifications.length;
    return notifications.filter((n) => n.category === category).length;
    // eslint-disable-next-line no-unreachable
  };

  const getCategoryUnreadCount = (category: NotificationCategory) => {
    if (category === "all") return unreadCount;
    return notifications.filter((n) => n.category === category && !n.read).length;
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Sidebar de categorías */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Categorías
              </h3>
              {(Object.keys(categoryConfig) as NotificationCategory[]).map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                const count = getCategoryCount(category);
                const unread = getCategoryUnreadCount(category);

                return (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                      "text-sm font-medium",
                      categoryFilter === category
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-card hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs",
                          categoryFilter === category ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                      {unread > 0 && (
                        <span
                          className={cn(
                            "inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full",
                            categoryFilter === category
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary/90 text-primary-foreground"
                          )}
                        >
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Lista de notificaciones */}
          <main className="flex-1 min-w-0">
            {/* Barra de acciones */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {categoryFilter === "all" ? "Todas" : categoryConfig[categoryFilter].label}
                </h2>
                <span className="text-sm text-muted-foreground">{filteredNotifications.length} notificaciones</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showOnlyUnread ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                >
                  Sin leer {showOnlyUnread && unreadCount > 0 && `(${unreadCount})`}
                </Button>

                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Contenido */}
            <div className="space-y-1">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="max-w-sm mx-auto space-y-2">
                    {showOnlyUnread ? (
                      <>
                        <CheckCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">Sin notificaciones pendientes</p>
                        <p className="text-xs">Estás al día con todas tus notificaciones</p>
                      </>
                    ) : (
                      <>
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No hay notificaciones</p>
                        <p className="text-xs">Las notificaciones aparecerán aquí</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={cn(
                      "w-full group relative flex items-start gap-4 px-4 py-3.5 rounded-lg transition-all duration-150",
                      "text-left border",
                      notification.read
                        ? "bg-background hover:bg-muted/50 border-transparent"
                        : "bg-card hover:bg-card/80 border-border shadow-sm"
                    )}
                  >
                    {/* Indicador de no leída */}
                    {!notification.read && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r" />}

                    {/* Icono */}
                    <div className={cn("flex-shrink-0 p-2 rounded-md", "bg-muted")}>
                      <div className={cn("w-4 h-4", notification.read ? "opacity-50" : "")}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3
                          className={cn(
                            "text-sm font-medium leading-tight",
                            notification.read ? "text-muted-foreground" : "text-foreground"
                          )}
                        >
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.timestamp}</span>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-relaxed line-clamp-2",
                          notification.read ? "text-muted-foreground/70" : "text-muted-foreground"
                        )}
                      >
                        {notification.description}
                      </p>
                    </div>

                    {/* Check si está leída */}
                    {notification.read && (
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Check className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
