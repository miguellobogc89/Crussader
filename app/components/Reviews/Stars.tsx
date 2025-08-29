// components/Stars.tsx
type Props = {
  value: number | null | undefined; // 0..5
  max?: number;                      // por defecto 5
  size?: number;                     // px por estrella (default 18)
  title?: string;
};

export function Stars({ value, max = 5, size = 18, title }: Props) {
  const v = typeof value === "number" ? Math.max(0, Math.min(max, Math.floor(value))) : 0;

  // colores: borde ámbar oscuro + relleno ámbar claro
  const stroke = "#B45309"; // amber-700
  const fill   = "#FDE68A"; // amber-200

  const Star = ({ filled, i }: { filled: boolean; i: number }) => (
    <svg
      key={i}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="img"
      style={{ display: "block" }}
    >
      <path
        d="M12 3.6l2.77 5.62 6.2.9-4.49 4.37 1.06 6.17L12 17.9 6.46 20.7l1.06-6.17L3.02 10.1l6.2-.9L12 3.6z"
        fill={filled ? fill : "transparent"}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={title ?? `Valoración: ${v} de ${max}`}
      title={title ?? `${v}/${max}`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} i={i} filled={i < v} />
      ))}
    </div>
  );
}
