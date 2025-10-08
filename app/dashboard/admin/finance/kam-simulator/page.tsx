// app/dashboard/finance/kam-simulator/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/app/components/ui/card";
import { Slider } from "@/app/components/ui/slider";
import { Input } from "@/app/components/ui/input";
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from "@/app/components/ui/select";
import { BarChart3, Coins, Users, TrendingUp, Calendar } from "lucide-react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* ---- Tooltip personalizado ---- */
function KamTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-lg border bg-white/95 p-3 shadow-md text-sm">
      <div className="font-semibold mb-2">{label}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-slate-500">PCR vendidas</span>
        <span className="text-right">{d.pcrUnits.toLocaleString("es-ES")}</span>

        <span className="text-slate-500">PAIA vendidas</span>
        <span className="text-right">{d.paiaUnits.toLocaleString("es-ES")}</span>

        <span className="text-slate-500">Facturación mes</span>
        <span className="text-right">
          {d.fact.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
        </span>

        <span className="text-slate-500 font-medium">KAM cobra (mes)</span>
        <span className="text-right font-semibold text-pink-600">
          {d.kamEarn.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}

export default function KamSimulatorPage() {
  /* ===== Estados base ===== */
  const [pvpPCR, setPvpPCR] = useState(39);
  const [pvpPAIA, setPvpPAIA] = useState(149);
  const [salesPCR, setSalesPCR] = useState(20); // uds/mes base
  const [salesPAIA, setSalesPAIA] = useState(5); // uds/mes base
  const [growth, setGrowth] = useState(8); // % mensual (num)
  const [vacationMonth, setVacationMonth] = useState("none"); // ese mes ventas=0

  const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  /* ===== Cálculo mensual con comisión 1/3 + 1/3 + 1/3 ===== */
  const data = useMemo(() => {
    // 1) Primero calculamos unidades, importes y facturación mensual "pura"
    const base = months.map((m, i) => {
      const isVacation = vacationMonth !== "none" && months.indexOf(vacationMonth) === i;
      const mult = isVacation ? 0 : 1 + (growth / 100) * i;

      // Unidades enteras
      const pcrUnits = Math.round(salesPCR * mult);
      const paiaUnits = Math.round(salesPAIA * mult);

      const importePCR = pcrUnits * pvpPCR;
      const importePAIA = paiaUnits * pvpPAIA;
      const fact = importePCR + importePAIA;

      return {
        name: m,
        pcrUnits,
        paiaUnits,
        importePCR,
        importePAIA,
        fact,
      };
    });

    // 2) Ahora aplicamos la renta del KAM como 17% de la suma de 1/3 de los 3 últimos meses
    const COMM = 0.17;
    const rows = base.map((row, i) => {
      const f0 = base[i]?.fact ?? 0;        // mes actual
      const f1 = base[i - 1]?.fact ?? 0;    // mes anterior
      const f2 = base[i - 2]?.fact ?? 0;    // dos meses antes

      const kamEarn = COMM * ((f0 / 3) + (f1 / 3) + (f2 / 3));

      return {
        ...row,
        kamEarn,
      };
    });

    // 3) Acumulados
    let accUnits = 0;
    let accImporte = 0;
    let accKAM = 0;

    return rows.map((row) => {
      const monthUnits = row.pcrUnits + row.paiaUnits;
      accUnits += monthUnits;
      accImporte += row.fact;
      accKAM += row.kamEarn;

      return {
        ...row,
        accUnits,
        accImporte,
        accKAM,
      };
    });
  }, [pvpPCR, pvpPAIA, salesPCR, salesPAIA, growth, vacationMonth, months]);

  const totalImporte = useMemo(() => data.reduce((a, b) => a + b.fact, 0), [data]);
  const totalKAM = useMemo(() => data.reduce((a, b) => a + b.kamEarn, 0), [data]);

  /* ===== Render ===== */
  return (
    <div className="p-8 space-y-10">
      <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="text-indigo-500 w-6 h-6" />
            <div>
              <CardTitle className="text-xl font-semibold">
                Simulador de Rentabilidad por KAM
              </CardTitle>
              <CardDescription>
                La gráfica muestra <b>lo que cobra el KAM cada mes</b> con <b>pago 1/3+1/3+1/3</b>.
                En vacaciones, aunque no haya ventas, el KAM cobra los tercios pendientes.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Parámetros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Precio PCR */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Coins className="text-indigo-500" />
                  <h3 className="font-medium">Precio PCR (€)</h3>
                </div>
                <span className="font-semibold text-indigo-600">{pvpPCR}</span>
              </div>
              <Slider value={[pvpPCR]} onValueChange={(v) => setPvpPCR(v[0])} min={10} max={100} step={1} />
            </div>

            {/* Precio PAIA */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Coins className="text-purple-500" />
                  <h3 className="font-medium">Precio PAIA (€)</h3>
                </div>
                <span className="font-semibold text-purple-600">{pvpPAIA}</span>
              </div>
              <Slider value={[pvpPAIA]} onValueChange={(v) => setPvpPAIA(v[0])} min={50} max={300} step={1} />
            </div>

            {/* % Incremento mensual */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-500" />
                  <h3 className="font-medium">% Incremento mensual</h3>
                </div>
                <Input
                  type="number"
                  value={growth}
                  onChange={(e) => setGrowth(Number(e.target.value))}
                  className="w-24 text-right"
                />
              </div>
            </div>

            {/* Ventas base PCR */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="text-indigo-500" />
                  <h3 className="font-medium">Ventas mensuales PCR</h3>
                </div>
                <span className="font-semibold text-indigo-600">{salesPCR}</span>
              </div>
              <Slider value={[salesPCR]} onValueChange={(v) => setSalesPCR(v[0])} min={0} max={100} step={1} />
            </div>

            {/* Ventas base PAIA */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-500" />
                  <h3 className="font-medium">Ventas mensuales PAIA</h3>
                </div>
                <span className="font-semibold text-purple-600">{salesPAIA}</span>
              </div>
              <Slider value={[salesPAIA]} onValueChange={(v) => setSalesPAIA(v[0])} min={0} max={50} step={1} />
            </div>

            {/* Vacaciones */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="text-orange-500" />
                  <h3 className="font-medium">Mes de vacaciones</h3>
                </div>
                <Select value={vacationMonth} onValueChange={(v) => setVacationMonth(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* KPIs totales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-4 border rounded-xl bg-indigo-50 text-indigo-700">
              <p className="text-sm font-semibold uppercase flex gap-2 items-center">
                <BarChart3 className="w-4 h-4" /> Importe anual total
              </p>
              <p className="text-2xl font-bold mt-2">
                {totalImporte.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-4 border rounded-xl bg-pink-50 text-pink-700">
              <p className="text-sm font-semibold uppercase flex gap-2 items-center">
                <Users className="w-4 h-4" /> Comisión KAM total (año)
              </p>
              <p className="text-2xl font-bold mt-2">
                {totalKAM.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          {/* Gráfica: renta mensual KAM con 1/3+1/3+1/3 */}
          <div className="h-80 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(v) =>
                    Number(v).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
                  }
                />
                <Tooltip content={<KamTooltip />} />
                <Line
                  type="monotone"
                  dataKey="kamEarn"
                  stroke="#EC4899"
                  strokeWidth={3}
                  dot={false}
                  name="KAM cobra (mes)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla completa */}
          <div className="overflow-x-auto mt-10">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-indigo-100 text-indigo-800">
                <tr>
                  <th className="px-3 py-2 text-left">Mes</th>
                  <th className="px-3 py-2 text-right">uds PCR</th>
                  <th className="px-3 py-2 text-right">Importe PCR</th>
                  <th className="px-3 py-2 text-right">uds PAIA</th>
                  <th className="px-3 py-2 text-right">Importe PAIA</th>
                  <th className="px-3 py-2 text-right">uds Acumuladas</th>
                  <th className="px-3 py-2 text-right">Importe acumulado</th>
                  <th className="px-3 py-2 text-right">Renta KAM (mes)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.name} className="odd:bg-white even:bg-indigo-50/50">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right">{r.pcrUnits.toLocaleString("es-ES")}</td>
                    <td className="px-3 py-2 text-right">
                      {r.importePCR.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right">{r.paiaUnits.toLocaleString("es-ES")}</td>
                    <td className="px-3 py-2 text-right">
                      {r.importePAIA.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right">{r.accUnits.toLocaleString("es-ES")}</td>
                    <td className="px-3 py-2 text-right">
                      {r.accImporte.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-right text-pink-600 font-medium">
                      {r.kamEarn.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-indigo-100 font-semibold text-indigo-800">
                <tr>
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">
                    {data.reduce((a, b) => a + b.pcrUnits, 0).toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {data.reduce((a, b) => a + b.importePCR, 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {data.reduce((a, b) => a + b.paiaUnits, 0).toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {data.reduce((a, b) => a + b.importePAIA, 0).toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {data[data.length - 1]?.accUnits.toLocaleString("es-ES")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {data[data.length - 1]?.accImporte.toLocaleString("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totalKAM.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
