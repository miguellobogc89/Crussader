"use client";

import { useState } from "react";
import { ReviewCard } from "@/app/components/reviews/ReviewCard";
import { EstablishmentTabs } from "@/app/components/establishments/EstablishmentTabs";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

// MOCK (sustituye luego con tus datos reales)
const mockReviews = [
  {
    id: "1",
    author: "María González",
    rating: 5,
    content:
      "Excelente servicio, el personal muy amable y profesional. La comida deliciosa y el ambiente muy acogedor. Definitivamente volveré pronto con mi familia.",
    date: "2 días",
    businessResponse: {
      content:
        "¡Muchas gracias María! Nos alegra mucho saber que disfrutaste de tu experiencia. Esperamos verte pronto junto a tu familia. ¡Saludos!",
      status: "published" as const,
    },
  },
  {
    id: "2",
    author: "Carlos Ruiz",
    rating: 4,
    content:
      "Muy buen lugar, la atención es rápida y eficiente. Los precios son justos y la calidad excelente. Solo mejoraría un poco la música de fondo.",
    date: "1 semana",
    businessResponse: {
      content:
        "Hola Carlos, gracias por tu reseña. Tomamos nota de tu sugerencia sobre la música, estamos trabajando en crear el ambiente perfecto para todos nuestros clientes.",
      status: "pending" as const,
    },
  },
  {
    id: "3",
    author: "Ana Martínez",
    rating: 5,
    content:
      "¡Increíble experiencia! El lugar está muy bien decorado, el servicio impecable y los platos son una obra de arte. Altamente recomendado para cualquier ocasión especial.",
    date: "3 días",
  },
  {
    id: "4",
    author: "Diego López",
    rating: 3,
    content:
      "El lugar está bien, pero esperaba un poco más. La comida estaba rica pero el servicio fue un poco lento. Quizás fue porque era fin de semana.",
    date: "5 días",
    businessResponse: {
      content:
        "Diego, gracias por tu feedback. Lamentamos que el servicio haya sido lento. Estamos implementando mejoras para los fines de semana para ofrecer una mejor experiencia.",
      status: "draft" as const,
    },
  },
  {
    id: "5",
    author: "Isabel Torres",
    rating: 5,
    content:
      "¡Absolutamente perfecto! Desde la entrada hasta el postre, todo estuvo espectacular. El chef realmente sabe lo que hace. Este será nuestro lugar favorito.",
    date: "1 día",
    businessResponse: {
      content:
        "¡Isabel, qué alegría leerte! Compartiremos tus palabras con todo el equipo, especialmente con nuestro chef. ¡Gracias por elegirnos como tu lugar favorito!",
      status: "published" as const,
    },
  },
  {
    id: "6",
    author: "Roberto Silva",
    rating: 4,
    content:
      "Buena experiencia en general. El ambiente es muy agradable y la ubicación perfecta. La carta tiene buena variedad y los precios están bien.",
    date: "4 días",
  },
];

export default function ReviewsDashboard() {
  const [selectedEstablishment, setSelectedEstablishment] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Tabs de locales */}
      <EstablishmentTabs onEstablishmentChange={setSelectedEstablishment} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Buscar reseñas..."
            className="pl-10 bg-card/50 border-border/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="whitespace-nowrap">
            <Filter size={16} className="mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-1" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Grid de reseñas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
        {mockReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            businessResponse={review.businessResponse}
          />
        ))}
      </div>
    </div>
  );
}
