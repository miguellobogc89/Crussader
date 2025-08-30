// app/hooks/locationEvents.ts
type Listener = (companyId: string) => void;

const listeners = new Set<Listener>();

// ⬇️ devuelve () => void, no boolean
export function onLocationsRefresh(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb); // <- no retornamos el boolean
  };
}

export function triggerLocationsRefresh(companyId: string) {
  for (const l of listeners) l(companyId);
}
