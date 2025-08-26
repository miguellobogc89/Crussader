export function Stars({ value }: { value: number | null | undefined }) {
  if (value == null) {
    return (
      <div className="inline-flex gap-0.5 text-gray-300">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarEmpty key={i} />
        ))}
      </div>
    );
  }

  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="inline-flex gap-0.5 text-yellow-500">
      {Array.from({ length: full }).map((_, i) => (
        <StarFull key={`f${i}`} />
      ))}
      {half && <StarHalf key="half" />}
      {Array.from({ length: empty }).map((_, i) => (
        <StarEmpty key={`e${i}`} />
      ))}
    </div>
  );
}

// ★ Lleno
function StarFull() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.975a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.463a1 1 0 00-.364 1.118l1.286 3.975c.3.921-.755 1.688-1.54 1.118l-3.388-2.463a1 1 0 00-1.176 0l-3.388 2.463c-.785.57-1.84-.197-1.54-1.118l1.286-3.975a1 1 0 00-.364-1.118L2.045 9.402c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.975z" />
    </svg>
  );
}

// ☆ Vacío
function StarEmpty() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.975a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.463a1 1 0 00-.364 1.118l1.286 3.975c.3.921-.755 1.688-1.54 1.118l-3.388-2.463a1 1 0 00-1.176 0l-3.388 2.463c-.785.57-1.84-.197-1.54-1.118l1.286-3.975a1 1 0 00-.364-1.118L2.045 9.402c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.975z"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ◐ Media
function StarHalf() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      className="w-5 h-5"
    >
      <defs>
        <linearGradient id="half">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.975a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.463a1 1 0 00-.364 1.118l1.286 3.975c.3.921-.755 1.688-1.54 1.118l-3.388-2.463a1 1 0 00-1.176 0l-3.388 2.463c-.785.57-1.84-.197-1.54-1.118l1.286-3.975a1 1 0 00-.364-1.118L2.045 9.402c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.975z"
        fill="url(#half)"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
