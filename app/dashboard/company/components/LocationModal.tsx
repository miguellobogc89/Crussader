"use client";
import { useState } from "react";

export type LocationForm = {
  title: string;
  email?: string | null;          // 🔧 ahora opcional
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
};

export function LocationModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: LocationForm) => Promise<void>;
}) {
  const [values, setValues] = useState<LocationForm>({ title: "", email: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    // 🔧 solo validamos título
    if (!values.title.trim()) {
      setErr("missing_title");
      return;
    }

    setLoading(true);
    try {
      // 🔧 normalizamos email a null si está vacío
      const payload: LocationForm = {
        ...values,
        email: values.email?.trim() ? values.email.trim() : null,
      };

      await onSubmit(payload);
      onClose();
      setValues({ title: "", email: "" });
    } catch (e) {
      setErr("create_location_error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Añadir ubicación</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handle} className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre de la ubicación *
                </label>
                <input
                  value={values.title}
                  onChange={(e)=>setValues(v=>({ ...v, title: e.target.value }))}
                  placeholder="Ej. Zara Gran Vía 32"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                {/* 🔧 quitamos el asterisco y no es required */}
                <label className="block text-sm font-medium mb-1">
                  Email de reseñas (opcional)
                </label>
                <input
                  type="email"
                  value={values.email || ""}
                  onChange={(e)=>setValues(v=>({ ...v, email: e.target.value }))}
                  placeholder="contacto@tienda.com"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  value={values.phone || ""}
                  onChange={(e)=>setValues(v=>({ ...v, phone: e.target.value }))}
                  placeholder="+34 600 000 000"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  value={values.address || ""}
                  onChange={(e)=>setValues(v=>({ ...v, address: e.target.value }))}
                  placeholder="Calle, número"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Ciudad</label>
                  <input
                    value={values.city || ""}
                    onChange={(e)=>setValues(v=>({ ...v, city: e.target.value }))}
                    placeholder="Madrid"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CP</label>
                  <input
                    value={values.postalCode || ""}
                    onChange={(e)=>setValues(v=>({ ...v, postalCode: e.target.value }))}
                    placeholder="28013"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  value={values.website || ""}
                  onChange={(e)=>setValues(v=>({ ...v, website: e.target.value }))}
                  placeholder="https://tuweb.com"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {err && <div className="mt-3 text-sm text-red-600">Error: {err}</div>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !values.title.trim()}  
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear ubicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
