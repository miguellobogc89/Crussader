export type SectionKey = "trends" | "analysis" | "locations" | "performance";

export type TrendRow = {
  month: string;       // "YYYY-MM"
  avgRating: number;   // rating medio del mes (1..5)
  reviews: number;     // nº reseñas del mes
  cumAvg?: number;     // rating acumulado (1..5)
  cumReviews?: number; // volumen acumulado
};
