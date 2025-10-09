// app/dashboard/products/page.tsx
"use client";

import { useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  FaRobot, FaComments, FaPhone, FaClock, FaShare, FaHeart, FaWhatsapp, FaHeadset,
  FaPenAlt, FaEye, FaEnvelope, FaChartLine, FaCalendarPlus, FaUserTie,
  FaPlus, FaCog, FaUsers, FaCalendarAlt, FaCreditCard, FaCheck, FaStar,
} from "react-icons/fa";

interface Product {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: "ai" | "automation" | "analytics" | "communication";
  isContracted: boolean;
  price?: number;
  billingCycle?: "monthly" | "yearly";
  renewalDate?: string;
  users?: number;
  maxUsers?: number;
  features: string[];
  status?: "active" | "paused" | "trial";
  trialDaysLeft?: number;
}

const products: Product[] = [
  {
    id: "reviews-ai", name: "Respondedor de Reviews IA",
    description: "Respuestas automáticas inteligentes a reseñas de Google",
    icon: FaRobot, category: "ai", isContracted: true,
    price: 49, billingCycle: "monthly", renewalDate: "2024-10-23",
    status: "active",
    features: ["Respuestas automáticas", "Análisis de sentimientos", "Múltiples idiomas", "Personalización avanzada"]
  },
  {
    id: "webchat-ai", name: "Webchat con IA",
    description: "Chatbots inteligentes para tu sitio web",
    icon: FaComments, category: "ai", isContracted: true,
    price: 89, billingCycle: "monthly", renewalDate: "2024-11-15",
    users: 3, maxUsers: 5, status: "active",
    features: ["Chat 24/7", "Integración web", "Análisis conversacional", "Base de conocimiento"]
  },
  {
    id: "phone-agents", name: "Agentes Telefónicos IA",
    description: "Atención telefónica automatizada con IA",
    icon: FaPhone, category: "ai", isContracted: true,
    price: 199, billingCycle: "monthly", renewalDate: "2024-12-01",
    status: "trial", trialDaysLeft: 12,
    features: ["Voz natural", "Integración PBX", "Transcripción automática", "Routing inteligente"]
  },
  {
    id: "employee-clock", name: "Control de Fichaje",
    description: "Sistema de control horario para empleados",
    icon: FaClock, category: "automation", isContracted: true,
    price: 29, billingCycle: "monthly", renewalDate: "2024-10-30",
    users: 12, maxUsers: 15, status: "active",
    features: ["Fichaje móvil", "Geolocalización", "Informes automáticos", "Integración nóminas"]
  },
  {
    id: "social-automation", name: "Automatización Redes Sociales",
    description: "Gestión y publicación automática en redes sociales",
    icon: FaShare, category: "automation", isContracted: false,
    price: 79, billingCycle: "monthly",
    features: ["Publicación programada", "Respuestas automáticas", "Análisis engagement", "Múltiples plataformas"]
  },
  {
    id: "sentiment-analysis", name: "Análisis de Sentimientos",
    description: "Análisis emocional avanzado de interacciones con clientes",
    icon: FaHeart, category: "analytics", isContracted: false,
    price: 59, billingCycle: "monthly",
    features: ["Análisis en tiempo real", "Dashboards emocionales", "Alertas automáticas", "Reportes detallados"]
  },
  {
    id: "whatsapp-bot", name: "Chatbot WhatsApp/Telegram",
    description: "Bots inteligentes para mensajería instantánea",
    icon: FaWhatsapp, category: "ai", isContracted: false,
    price: 69, billingCycle: "monthly",
    features: ["Múltiples canales", "Integración CRM", "Respuestas multimedia", "Flujos conversacionales"]
  },
  {
    id: "support-tickets", name: "Sistema de Tickets IA",
    description: "Gestión automatizada de soporte al cliente",
    icon: FaHeadset, category: "automation", isContracted: false,
    price: 99, billingCycle: "monthly",
    features: ["Clasificación automática", "Escalado inteligente", "Base de conocimiento", "SLA automático"]
  },
  {
    id: "content-generator", name: "Generador de Contenido IA",
    description: "Creación automática de contenido para marketing",
    icon: FaPenAlt, category: "ai", isContracted: false,
    price: 129, billingCycle: "monthly",
    features: ["Contenido multicanal", "SEO optimizado", "Múltiples formatos", "Personalización marca"]
  },
  {
    id: "reputation-monitor", name: "Monitor de Reputación",
    description: "Monitoreo automático de menciones y reputación online",
    icon: FaEye, category: "analytics", isContracted: false,
    price: 89, billingCycle: "monthly",
    features: ["Monitoreo 24/7", "Alertas instantáneas", "Análisis competencia", "Informes reputación"]
  },
  {
    id: "email-automation", name: "Email Marketing Automatizado",
    description: "Campañas de email inteligentes y personalizadas",
    icon: FaEnvelope, category: "automation", isContracted: false,
    price: 49, billingCycle: "monthly",
    features: ["Segmentación IA", "A/B testing", "Autoresponders", "Analytics avanzados"]
  },
  {
    id: "advanced-analytics", name: "Analytics Avanzado",
    description: "Dashboard de métricas y KPIs con IA predictiva",
    icon: FaChartLine, category: "analytics", isContracted: false,
    price: 149, billingCycle: "monthly",
    features: ["IA predictiva", "Dashboards personalizados", "Alertas inteligentes", "Integración múltiple"]
  },
  {
    id: "booking-automation", name: "Sistema de Citas Automatizado",
    description: "Gestión inteligente de reservas y citas",
    icon: FaCalendarPlus, category: "automation", isContracted: false,
    price: 79, billingCycle: "monthly",
    features: ["Reservas 24/7", "Confirmación automática", "Recordatorios IA", "Integración calendario"]
  },
  {
    id: "smart-crm", name: "CRM Inteligente",
    description: "Gestión de clientes potenciada con inteligencia artificial",
    icon: FaUserTie, category: "automation", isContracted: false,
    price: 199, billingCycle: "monthly",
    features: ["Lead scoring IA", "Automatización ventas", "Predicción comportamiento", "Integración omnicanal"]
  },
];

const categoryColors = {
  ai: "bg-purple-100 text-purple-800",
  automation: "bg-blue-100 text-blue-800",
  analytics: "bg-green-100 text-green-800",
  communication: "bg-orange-100 text-orange-800",
} as const;

const categoryNames = {
  ai: "Inteligencia Artificial",
  automation: "Automatización",
  analytics: "Análisis",
  communication: "Comunicación",
} as const;

function ProductCard({ product, isContracted }: { product: Product; isContracted: boolean }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card via-card to-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <product.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{product.name}</CardTitle>
              <Badge className={`mt-1 ${categoryColors[product.category]}`}>
                {categoryNames[product.category]}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="text-sm leading-relaxed mt-2">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="text-sm font-medium text-muted-foreground">Características:</div>
          <div className="grid grid-cols-1 gap-1">
            {product.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <FaCheck className="h-3 w-3 text-success flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <FaCog className="h-4 w-4 mr-2" />
            {isContracted ? "Configurar" : "Contratar"}
          </Button>
          <Button variant="outline" size="sm" aria-label={isContracted ? "Gestionar usuarios" : "Destacar"}>
            {isContracted ? <FaUsers className="h-4 w-4" /> : <FaStar className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const [selectedTab, setSelectedTab] = useState<"contracted" | "available">("contracted");

  const contractedProducts = products.filter((p) => p.isContracted);
  const availableProducts = products.filter((p) => !p.isContracted);

  return (
    <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)} className="w-full">
      <PageShell
        title="Productos"
        description="Gestiona tus módulos contratados y descubre nuevas capacidades para tu negocio."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Productos" },
        ]}
        /* Toolbar con los tabs y las acciones a la derecha */
        toolbar={
          <div className="flex justify-between items-center">
            <TabsList className="grid w-auto grid-cols-2">
              <TabsTrigger value="contracted" className="flex items-center gap-2">
                <FaCheck className="h-4 w-4" />
                Mis Productos ({contractedProducts.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <FaPlus className="h-4 w-4" />
                Disponibles ({availableProducts.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FaCalendarAlt className="h-4 w-4 mr-2" />
                Historial
              </Button>
              <Button variant="outline" size="sm">
                <FaCreditCard className="h-4 w-4 mr-2" />
                Facturación
              </Button>
            </div>
          </div>
        }
        variant="default"
        backFallback="/dashboard"
        showShellBadge={true}
      >
        {/* BODY */}
        <div className="space-y-6">
          <TabsContent value="contracted" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {contractedProducts.map((product) => (
                <ProductCard key={product.id} product={product} isContracted />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {availableProducts.map((product) => (
                <ProductCard key={product.id} product={product} isContracted={false} />
              ))}
            </div>
          </TabsContent>
        </div>
      </PageShell>
    </Tabs>
  );
}
