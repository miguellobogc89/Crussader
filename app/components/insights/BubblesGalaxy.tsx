"use client";

import * as React from "react";
import * as d3 from "d3";

type BubbleItem = {
  label: string;
  freq: number;           // frecuencia por label
  rating: number | null;  // 0..5 (null -> gris)
};

type Props = {
  companyId?: string | null;
  locationId?: string | null;
  from?: string | null; // YYYY-MM-DD (si en el futuro filtras en el API)
  to?: string | null;   // YYYY-MM-DD
  maxNodes?: number;    // top-N por frecuencia (default 60)
  height?: number;      // alto del SVG (responsive horizontal)
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

/** Paleta continua 0..5 → rojo→ámbar→verde (con fallback gris si null) */
function colorFromRating(r: number | null) {
  if (r == null || Number.isNaN(r)) return "rgba(128,128,128,0.35)";
  const rr = clamp(r, 0, 5) / 5; // 0..1
  // Interpolamos de 0(0°=rojo) → 0.6(108°~verde), usando HSL
  const hue = 0 + rr * 108; // rojo→verde
  const fill = `hsla(${hue}, 70%, 50%, 0.35)`; // semitransparente
  return fill;
}

function strokeFromRating(r: number | null) {
  if (r == null || Number.isNaN(r)) return "rgba(100,100,100,0.95)";
  const rr = clamp(r, 0, 5) / 5;
  const hue = 0 + rr * 108;
  return `hsla(${hue}, 75%, 35%, 0.95)`; // borde más oscuro y opaco
}

export default function BubblesGalaxy({
  companyId,
  locationId,
  from = null,
  to = null,
  maxNodes = 60,
  height = 520,
}: Props) {
  const [data, setData] = React.useState<BubbleItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  // 1) Cargar datos desde el endpoint de concepts (filtra por company/location)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (companyId) params.set("companyId", companyId);
        if (locationId) params.set("locationId", locationId);
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const res = await fetch(`/api/reviews/tasks/concepts/list?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // Esperamos: { ok, concepts: [{ id, label, avg_rating | rating }] }
        const rows = Array.isArray(json?.concepts) ? json.concepts : [];
        // Agrupamos por label (frecuencia = cuántas filas comparten el label)
        const map = new Map<string, { freq: number; ratingSum: number; ratingCount: number }>();
        for (const r of rows) {
          const label = String(r.label ?? "").trim();
          if (!label) continue;
          const rating =
            typeof r.avg_rating === "number"
              ? r.avg_rating
              : typeof r.rating === "number"
              ? r.rating
              : null;

          const g = map.get(label) ?? { freq: 0, ratingSum: 0, ratingCount: 0 };
          g.freq += 1;
          if (typeof rating === "number" && Number.isFinite(rating)) {
            g.ratingSum += rating;
            g.ratingCount += 1;
          }
          map.set(label, g);
        }

        let items: BubbleItem[] = Array.from(map.entries()).map(([label, g]) => ({
          label,
          freq: g.freq,
          rating: g.ratingCount ? g.ratingSum / g.ratingCount : null,
        }));

        // Top-N por frecuencia
        items = items
          .sort((a, b) => b.freq - a.freq || (b.rating ?? 0) - (a.rating ?? 0))
          .slice(0, maxNodes);

        if (!cancelled) setData(items);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "No se pudieron cargar las burbujas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, locationId, from, to, maxNodes]);

  // 2) Render D3 (force + colisión)
  React.useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;

    const nodeData = data.map((d, i) => ({
      ...d,
      x: (i + 1) * 7, // seed
      y: (i + 1) * 5,
      r: 1,
    }));

    // wrapper width (responsive)
    const width = wrapperRef.current?.clientWidth ?? 900;

    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", "100%").attr("height", height);

    // escalas
    const maxFreq = d3.max(nodeData, (d) => d.freq) ?? 1;
    const rScale = d3
      .scaleSqrt()
      .domain([1, Math.max(2, maxFreq)])
      .range([10, Math.min(120, Math.max(30, width / 15))]); // radios buenos

    // nodos
    nodeData.forEach((n) => (n.r = rScale(n.freq)));

    // fuerza
    const simulation = d3
      .forceSimulation(nodeData as any)
      .force(
        "center",
        d3.forceCenter(width / 2, height / 2)
      )
      .force(
        "x",
        d3.forceX(width / 2).strength(0.05)
      )
      .force(
        "y",
        d3.forceY(height / 2).strength(0.05)
      )
      .force(
        "collision",
        d3.forceCollide<any>().radius((d) => d.r + 2).iterations(2)
      )
      .velocityDecay(0.22)
      .alpha(1)
      .alphaDecay(0.02);

    // limpiar
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // tooltip simple
    const tooltip = d3
      .select(wrapperRef.current)
      .append("div")
      .style("position", "absolute")
      .style("pointerEvents", "none")
      .style("padding", "8px 10px")
      .style("fontSize", "12px")
      .style("borderRadius", "10px")
      .style("background", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("opacity", 0)
      .style("transform", "translateY(-8px)")
      .style("transition", "opacity 120ms ease");

    // nodos visuales
    const nodes = g
      .selectAll("g.node")
      .data(nodeData, (d: any) => d.label)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("mousemove", function (event: MouseEvent, d: any) {
        const [mx, my] = d3.pointer(event as any, wrapperRef.current as any);
        tooltip
          .style("left", `${mx + 12}px`)
          .style("top", `${my - 8}px`)
          .style("opacity", 1)
          .html(
            `<div style="font-weight:600;margin-bottom:2px">${d.label}</div>
             <div>freq: ${d.freq}</div>
             <div>★ ${d.rating != null ? (Math.round(d.rating * 100) / 100).toFixed(2) : "—"}</div>`
          );
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

    const circles = nodes
      .append("circle")
      .attr("r", (d: any) => d.r)
      .attr("fill", (d: any) => colorFromRating(d.rating))
      .attr("stroke", (d: any) => strokeFromRating(d.rating))
      .attr("stroke-width", 2.5);

    // etiquetas (recortadas)
    const labels = nodes
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("fontSize", "12px")
      .style("fontWeight", 600)
      .style("fill", "rgba(0,0,0,0.85)")
      .text((d: any) => {
        const maxChars = Math.max(4, Math.floor((d.r as number) / 3)); // más grande ⇒ más chars
        const s = String(d.label);
        return s.length > maxChars ? s.slice(0, maxChars - 1) + "…" : s;
      });

    simulation.on("tick", () => {
      nodes.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // cleanup
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [data, height]);

  return (
    <div ref={wrapperRef} className="w-full relative">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          {loading ? "Cargando burbujas…" : error ? `Error: ${error}` : `${data.length} conceptos`}
        </div>
        <div className="text-xs text-muted-foreground">
          tamaño ∝ frecuencia · color ∝ ★rating
        </div>
      </div>
      <svg ref={svgRef} role="img" aria-label="Nube de burbujas de conceptos" />
    </div>
  );
}
