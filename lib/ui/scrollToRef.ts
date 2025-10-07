// lib/ui/scrollToRef.ts
export function scrollToRef(ref: React.RefObject<HTMLElement | null>, offset = 80) {
  const el = ref.current;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const y = window.scrollY + rect.top - offset;
  window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}
