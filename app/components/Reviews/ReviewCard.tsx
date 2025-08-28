import GenerateReviewResponseButton from "@/app/components/Reviews/GenerateReviewResponseButton";

type Props = {
  reviewId: string;      // ⬅️ NUEVO: id de la review para el endpoint
  author: string;
  rating: number;        // 1..5 (float permitido)
  comment: string;
  business?: string;
  createdAt: Date | string;
};

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const total = 5;

  const StarFull = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" fill="#3b82f6"/>
    </svg>
  );
  const StarHalf = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" fill="url(#half)"/>
    </svg>
  );
  const StarEmpty = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24z" fill="#e5e7eb"/>
    </svg>
  );

  const out = [];
  for (let i = 0; i < full; i++) out.push(<StarFull key={`f${i}`} />);
  if (hasHalf) out.push(<StarHalf key="h" />);
  while (out.length < total) out.push(<StarEmpty key={`e${out.length}`} />);
  return <div className="d-flex align-items-center gap-1">{out}</div>;
}

export default function ReviewCard({
  reviewId,
  author,
  rating,
  comment,
  business,
  createdAt,
}: Props) {
  const dt = new Date(createdAt);

  // Detecta prefijo [CATEGORÍA] y separa
  let heading: string | null = null;
  let body = comment ?? "";
  const m = body.match(/^\[(.+?)\]\s+/); // [Categoria] ...
  if (m) {
    heading = m[1];
    body = body.slice(m[0].length);
  }

  return (
    <div
      className="card h-100"
      style={{
        border: "1px solid #e6eefc",
        boxShadow:
          "-10px -10px 24px rgba(59,130,246,.10), 0 4px 14px rgba(0,0,0,.06)",
        borderRadius: 14,
      }}
    >
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="card-title mb-1">{author || "Anónimo"}</h5>
            {business && <div className="text-secondary small">{business}</div>}
          </div>
          <Stars rating={rating} />
        </div>

        {heading && (
          <div className="fw-bold mb-2" style={{ color: "#1f2937" }}>
            {heading}
          </div>
        )}

        <p className="card-text text-muted" style={{ whiteSpace: "pre-wrap" }}>
          {body}
        </p>

        {/* Botón para generar respuesta IA */}
        <div className="mt-3">
          <GenerateReviewResponseButton reviewId={reviewId} />
        </div>
      </div>

      <div className="card-footer bg-white border-0 pt-0 pb-3" style={{ paddingRight: 12 }}>
        <div className="d-flex justify-content-end text-secondary small">
          {dt.toLocaleDateString()} · {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}
