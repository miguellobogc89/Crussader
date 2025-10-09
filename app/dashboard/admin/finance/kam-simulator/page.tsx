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
import ResultsTable from "@/app/components/admin/finance/ResultsTable";

const formatEUR = (value: number) =>
  value.toLocaleString("es-IS", { // <- typo deliberado? NO! usar es-ES:
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });
// corregimos:
const formatEUR2 = (value: number) =>
  value.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

const formatEUR0 = (value: number) =>
  value.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  });

/* ---- Tooltip gráfico ---- */
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
        <span className="text-right">{formatEUR2(d.fact)}</span>

        <span className="text-slate-500 font-medium">KAM cobra (mes)</span>
        <span className="text-right font-semibold text-pink-600">
          {formatEUR0(d.kamEarn)}
        </span>
      </div>
    </div>
  );
}

function Indicators({
  totalImporte,
  totalEmpresaMes,
  totalBeneficioEmpresaMes,
  totalKam,
}: {
  totalImporte: number;
  totalEmpresaMes: number;
  totalBeneficioEmpresaMes: number;
  totalKam: number;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
      <div className="p-4 border rounded-xl bg-indigo-50 text-indigo-700">
        <p className="text-sm font-semibold uppercase flex gap-2 items-center">
          <BarChart3 className="w-4 h-4" /> Importe anual total (ventas nuevas)
        </p>
        <p className="text-2xl font-bold mt-2">{formatEUR2(totalImporte)}</p>
      </div>
      <div className="p-4 border rounded-xl bg-emerald-50 text-emerald-700">
        <p className="text-sm font-semibold uppercase flex gap-2 items-center">
          <BarChart3 className="w-4 h-4" /> Empresa (anual)
        </p>
        <p className="text-2xl font-bold mt-2">{formatEUR2(totalEmpresaMes)}</p>
      </div>
      <div className="p-4 border rounded-xl bg-blue-50 text-blue-700">
        <p className="text-sm font-semibold uppercase flex gap-2 items-center">
          <BarChart3 className="w-4 h-4" /> Beneficio empresa (anual, -25%)
        </p>
        <p className="text-2xl font-bold mt-2">{formatEUR2(totalBeneficioEmpresaMes)}</p>
      </div>
      <div className="p-4 border rounded-xl bg-pink-50 text-pink-700">
        <p className="text-sm font-semibold uppercase flex gap-2 items-center">
          <Users className="w-4 h-4" /> Renta KAM total (año)
        </p>
        <p className="text-2xl font-bold mt-2">{formatEUR0(totalKam)}</p>
      </div>
    </div>
  );
}

function KamChart({ data }: { data: any[] }) {
  return (
    <div className="h-80 mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(v) => formatEUR0(Number(v))} width={80} />
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
  );
}

export default function KamSimulatorPage() {
  // Estados
  const [pvpPCR, setPvpPCR] = useState(39);
  const [pvpPAIA, setPvpPAIA] = useState(149);
  const [salesPCR, setSalesPCR] = useState(20);
  const [salesPAIA, setSalesPAIA] = useState(5);
  const [growth, setGrowth] = useState(8);
  const [vacationMonth, setVacationMonth] = useState("none");

  const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  // Cálculos
  const data = useMemo(() => {
    // 1) Ventas del mes (unidades enteras) y facturación del mes
    const base = months.map((m, i) => {
      const isVacation = vacationMonth !== "none" && months.indexOf(vacationMonth) === i;
      const mult = isVacation ? 0 : 1 + (growth / 100) * i;

      const pcrUnits  = Math.round(salesPCR  * mult);
      const paiaUnits = Math.round(salesPAIA * mult);

      const importePCR  = pcrUnits  * pvpPCR;
      const importePAIA = paiaUnits * pvpPAIA;
      const fact = importePCR + importePAIA; // ventas NUEVAS del mes

      return { name: m, pcrUnits, paiaUnits, importePCR, importePAIA, fact };
    });

    // 2) Renta KAM (1/3 del mes + 1/3 del mes-1 + 1/3 del mes-2)
    const rows = base.map((row, i) => {
      const f0 = base[i]?.fact ?? 0;
      const f1 = base[i - 1]?.fact ?? 0;
      const f2 = base[i - 2]?.fact ?? 0;
      const kamEarn = (f0 + f1 + f2) / 3;
      return { ...row, kamEarn };
    });

    // 3) Acumulados y cálculo de MRR (Importe acumulado) + Empresa (mes)
    let accPCRUnits = 0;
    let accPAIAUnits = 0;
    let accUnits = 0;

    return rows.map((row) => {
      accPCRUnits += row.pcrUnits;
      accPAIAUnits += row.paiaUnits;
      accUnits     += row.pcrUnits + row.paiaUnits;

      // ⚠️ Importe acumulado = MRR del mes = (acum PCR * PVP PCR) + (acum PAIA * PVP PAIA)
      const accImporte = accPCRUnits * pvpPCR + accPAIAUnits * pvpPAIA;

      // ✅ Empresa (mes) = Importe acumulado - Renta KAM (mes)
      const empresaMes = accImporte - row.kamEarn;

      // ✅ Beneficio empresa (mes) = Empresa (mes) * 0.75
      const beneficioEmpresaMes = empresaMes * 0.75;

      const pctKamOverBeneficio =
        beneficioEmpresaMes > 0 ? row.kamEarn / beneficioEmpresaMes : 0;

      return {
        ...row,
        accUnits,
        accImporte,              // esto es lo que enseñas en "Importe acumulado"
        empresaMes,
        beneficioEmpresaMes,
        pctKamOverBeneficio,
      };
    });
  }, [pvpPCR, pvpPAIA, salesPCR, salesPAIA, growth, vacationMonth]);


  const totals = useMemo(() => {
    const totalPcrUnits       = data.reduce((a, b) => a + b.pcrUnits, 0);
    const totalPaiaUnits      = data.reduce((a, b) => a + b.paiaUnits, 0);
    const totalImportePCR     = data.reduce((a, b) => a + b.importePCR, 0);
    const totalImportePAIA    = data.reduce((a, b) => a + b.importePAIA, 0);
    const totalAccUnits       = data.length ? data[data.length - 1].accUnits : 0;
    const totalAccImporte     = data.length ? data[data.length - 1].accImporte : 0; // <-- MRR final
    const totalEmpresaMes     = data.reduce((a, b) => a + b.empresaMes, 0);
    const totalBeneficioEmp   = data.reduce((a, b) => a + b.beneficioEmpresaMes, 0);
    const totalKam            = data.reduce((a, b) => a + b.kamEarn, 0);
    const pctKamOverBeneficio = totalBeneficioEmp > 0 ? totalKam / totalBeneficioEmp : 0;

    return {
      totalPcrUnits,
      totalPaiaUnits,
      totalImportePCR,
      totalImportePAIA,
      totalAccUnits,
      totalAccImporte,
      totalEmpresaMes,
      totalBeneficioEmpresaMes: totalBeneficioEmp,
      totalKam,
      pctKamOverBeneficio,
    };
  }, [data]);


  const totalImporte = totals.totalAccImporte;

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
                Gráfica: renta mensual del KAM con regla <b>1/3 + 1/3 + 1/3</b>.  
                En vacaciones, si hay tercios pendientes, el KAM sigue cobrando.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Parámetros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PCR */}
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

            {/* PAIA */}
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

            {/* % incremento */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-500" />
                  <h3 className="font-medium">% Incremento mensual</h3>
                </div>
                <Input type="number" value={growth} onChange={(e) => setGrowth(Number(e.target.value))} className="w-24 text-right" />
              </div>
            </div>

            {/* Ventas PCR */}
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

            {/* Ventas PAIA */}
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

          {/* Indicadores */}
          <Indicators
            totalImporte={totalImporte}
            totalEmpresaMes={totals.totalEmpresaMes}
            totalBeneficioEmpresaMes={totals.totalBeneficioEmpresaMes}
            totalKam={totals.totalKam}
          />

          {/* Gráfico */}
          <div className="h-80 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => formatEUR0(Number(v))} width={80} />
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

          {/* Tabla */}
          <ResultsTable data={data as any[]} totals={totals as any} />
        </CardContent>
      </Card>
    </div>
  );
}
