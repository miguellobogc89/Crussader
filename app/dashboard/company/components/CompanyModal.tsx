"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export type CompanyFormValues = {
  name: string;
  cif?: string;
  employeesBand?: string;
  activity?: string;
  logoDataUrl?: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<CompanyFormValues>;
  onClose: () => void;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
};

const EMPLOYEE_OPTIONS = [
  "1-5","6-10","11-20","21-50","51-100",
  "101-250","251-500","501-1000","1000+",
];

const ACTIVITY_OPTIONS = [
  "Restaurante","Cafetería","Bar","Catering",
  "Bufete","Consultoría legal","Notaría",
  "Inmobiliaria","Promotora","Gestoría",
  "Servicios IT","Desarrollo software","Ciberseguridad",
  "Marketing","Publicidad","SEO/SEM","Diseño",
  "Mantenimiento","Limpieza","Seguridad",
  "Transporte","Logística","Mensajería",
  "Salud","Clínica","Fisioterapia","Odontología",
  "Educación","Academia","Formación",
  "Retail","Moda","Electrónica",
  "Turismo","Hotel","Agencia de viajes",
  "Construcción","Arquitectura","Ingeniería",
  "Finanzas","Contabilidad","Asesoría",
  "RRHH","Selección","Outsourcing",
  "Otros",
];

export default function CompanyModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const [values, setValues] = useState<CompanyFormValues>({
    name: "",
    cif: "",
    employeesBand: "",
    activity: "",
    logoDataUrl: undefined,
  });
  const [activityQuery, setActivityQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErr("");
    setSubmitting(false);
    setActivityQuery("");
    setValues({
      name: initial?.name ?? "",
      cif: initial?.cif ?? "",
      employeesBand: initial?.employeesBand ?? "",
      activity: initial?.activity ?? "",
      logoDataUrl: initial?.logoDataUrl,
    });
  }, [open, initial]);

  const filteredActivities = useMemo(() => {
    const q = activityQuery.trim().toLowerCase();
    if (!q) return ACTIVITY_OPTIONS;
    return ACTIVITY_OPTIONS.filter(a => a.toLowerCase().includes(q));
  }, [activityQuery]);

  function pickLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setValues(v => ({ ...v, logoDataUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!values.name?.trim()) {
      setErr("missing_name");
      return;
    }
    setSubmitting(true);
    try {
      const payload: CompanyFormValues = {
        name: values.name.trim(),
        cif: values.cif?.trim() || undefined,
        employeesBand: values.employeesBand || undefined,
        activity: values.activity || undefined,
        logoDataUrl: values.logoDataUrl,
      };
      await onSubmit(payload);
      onClose();
    } catch (e) {
      setErr("save_error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Editar empresa" : "Nueva empresa"}
          </h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Columna izquierda */}
            <div className="space-y-4">
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium mb-1">Logo</label>
                <div
                  className="border-2 border-dashed rounded-xl p-4 flex items-center gap-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f) pickLogo(f);
                  }}
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {values.logoDataUrl
                      ? <img src={values.logoDataUrl} alt="logo" className="w-full h-full object-cover" />
                      : <span className="text-xs text-gray-500">Sin logo</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      Arrastra una imagen o{" "}
                      <button
                        type="button"
                        className="text-purple-600 underline"
                        onClick={() => fileRef.current?.click()}
                      >
                        selecciona un archivo
                      </button>
                    </p>
                    <p className="text-xs text-gray-400">PNG/JPG/SVG — máx. ~2MB</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickLogo(f);
                    }}
                  />
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  value={values.name}
                  onChange={(e) => setValues(v => ({ ...v, name: e.target.value }))}
                  placeholder="Ej. Acme S.A."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* CIF */}
              <div>
                <label className="block text-sm font-medium mb-1">CIF</label>
                <input
                  value={values.cif || ""}
                  onChange={(e) => setValues(v => ({ ...v, cif: e.target.value.toUpperCase() }))}
                  placeholder="Ej. B12345678"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              {/* Nº empleados */}
              <div>
                <label className="block text-sm font-medium mb-1">Nº de empleados</label>
                <select
                  value={values.employeesBand || ""}
                  onChange={(e) => setValues(v => ({ ...v, employeesBand: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="">Selecciona…</option>
                  {EMPLOYEE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Actividad (buscable + selección) */}
              <div>
                <label className="block text-sm font-medium mb-1">Actividad</label>
                <input
                  value={activityQuery}
                  onChange={(e) => setActivityQuery(e.target.value)}
                  placeholder="Buscar actividad…"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
                />
                <div className="max-h-40 overflow-auto border rounded-lg">
                  {filteredActivities.map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setValues(v => ({ ...v, activity: opt }))}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${values.activity === opt ? "bg-purple-50" : ""}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {values.activity && (
                  <p className="text-xs text-gray-600 mt-1">
                    Seleccionado: <span className="font-medium">{values.activity}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {err && <div className="mt-3 text-sm text-red-600">Error: {err}</div>}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !values.name?.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? (mode === "edit" ? "Guardando..." : "Creando...") : (mode === "edit" ? "Guardar" : "Crear empresa")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
