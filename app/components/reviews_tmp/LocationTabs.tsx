"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type TabItem = {
  id: string;
  title: string;
  company?: { name?: string | null } | null;
  reviewsAvg: number;
};

export default function LocationTabs({
  locations,
  activeLocationId,
}: {
  locations: TabItem[];
  activeLocationId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // 👈 ruta actual, p.ej. /dashboard/reviews

  const handleClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("locationId", id);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false }); // 👈 usa pathname actual
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-2">
      {locations.map((l) => {
        const active = l.id === activeLocationId;
        return (
          <button
            key={l.id}
            onClick={() => handleClick(l.id)}
            className={[
              "flex justify-between items-center w-56 rounded-xl px-4 py-3 text-sm shadow-sm transition-colors border",
              active
                ? "bg-white border-neutral-200 shadow-md"
                : "bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200",
            ].join(" ")}
          >
            <div className="flex flex-col text-left">
              <span className="font-semibold">{l.title}</span>
              <span className="text-xs text-neutral-500">{l.company?.name ?? ""}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-neutral-800">
              {l.reviewsAvg.toFixed(1)} <span className="text-yellow-500">★</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
