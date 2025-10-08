// app/dashboard/finance/kam-simulator/page.tsx
"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Slider } from "@/app/components/ui/slider";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/app/components/ui/select";
import {
  BarChart3,
  Coins,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function KamSimulatorPage() {
  /* ===== Estados base ===== */
  const [pvpPCR, setPvpPCR] = useState(39);
  const [pvpPAIA, setPvpPAIA] = useState(149);
  const [salesPCR, setSalesPCR] = useState(20);
  const [salesPAIA, setSalesPAIA] = useState(5);
  const [growth, setGrowth] = useState(8); // % mensual
  const [vacationMonth, setVacationMonth] = useState("none");

  const months = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  /* ===== Cálculo mensual ===== */
  const data = useMemo(() => {
    let accFact = 0;
    let accKAM = 0;

    return months.map((m, i) => {
      const isVacation =
        vacationMonth !== "none" &&
        months.indexOf(vacationMonth) === i;

      const mult = isVacation ? 0 : 1 + (growth / 100) * i;
      const pcrSold = salesPCR * mult;
      const paiaSold = salesPAIA * mult;
      const fact = pcrSold * pvpPCR + paiaSold * pvpPAIA;
      const kamEarn = fact * 0.17;

      accFact += fact;
      accKAM += kamEarn;

      return {
        name: m,
        pcrSold: pcrSold.toFixed(1),
        paiaSold: paiaSold.toFixed(1),
        fact: fact.toFixed(2),
        kamEarn: kamEarn.toFixed(2),
        accFact: accFact.toFixed(2),
        accKAM: accKAM.toFixed(2),
      };
    });
  }, [pvpPCR, pvpPAIA, salesPCR, salesPAIA, growth, vacationMonth]);

  const totalFact = data.reduce((a, b) => a + parseFloat(b.fact), 0);
  const totalKAM = data.reduce((a, b) => a + parseFloat(b.kamEarn), 0);

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
                Ajusta precios, ventas y crecimiento para proyectar los resultados anuales.
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
              <Slider
                value={[pvpPCR]}
                onValueChange={(v) => setPvpPCR(v[0])}
                min={10}
                max={100}
                step={1}
              />
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
              <Slider
                value={[pvpPAIA]}
                onValueChange={(v) => setPvpPAIA(v[0])}
                min={50}
                max={300}
                step={1}
              />
            </div>

            {/* Crecimiento */}
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
                  className="w-20 text-right"
                />
              </div>
            </div>

            {/* PCR ventas */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="text-indigo-500" />
                  <h3 className="font-medium">Ventas mensuales PCR</h3>
                </div>
                <span className="font-semibold text-indigo-600">{salesPCR}</span>
              </div>
              <Slider
                value={[salesPCR]}
                onValueChange={(v) => setSalesPCR(v[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* PAIA ventas */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-500" />
                  <h3 className="font-medium">Ventas mensuales PAIA</h3>
                </div>
                <span className="font-semibold text-purple-600">{salesPAIA}</span>
              </div>
              <Slider
                value={[salesPAIA]}
                onValueChange={(v) => setSalesPAIA(v[0])}
                min={0}
                max={50}
                step={1}
              />
            </div>

            {/* Vacaciones */}
            <div className="p-4 border rounded-xl bg-white/60 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="text-orange-500" />
                  <h3 className="font-medium">Mes de vacaciones</h3>
                </div>
                <Select
                  value={vacationMonth}
                  onValueChange={(v) => setVacationMonth(v)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="p-4 border rounded-xl bg-indigo-50 text-indigo-700">
              <p className="text-sm font-semibold uppercase flex gap-2 items-center">
                <BarChart3 className="w-4 h-4" /> Facturación anual
              </p>
              <p className="text-2xl font-bold mt-2">
                {totalFact.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div className="p-4 border rounded-xl bg-pink-50 text-pink-700">
              <p className="text-sm font-semibold uppercase flex gap-2 items-center">
                <Users className="w-4 h-4" /> Total comisión KAM
              </p>
              <p className="text-2xl font-bold mt-2">
                {totalKAM.toLocaleString("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          {/* Gráfica */}
          <div className="h-80 mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(v: any) =>
                    `${parseFloat(v).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    })}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fact"
                  stroke="#6366F1"
                  strokeWidth={2}
                  name="Facturación mensual"
                />
                <Line
                  type="monotone"
                  dataKey="kamEarn"
                  stroke="#EC4899"
                  strokeWidth={2}
                  name="Comisión KAM"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de resultados */}
          <div className="overflow-x-auto mt-10">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-indigo-100 text-indigo-800">
                <tr>
                  <th className="px-3 py-2 text-left">Mes</th>
                  <th className="px-3 py-2 text-right">PCR vendidas</th>
                  <th className="px-3 py-2 text-right">PAIA vendidas</th>
                  <th className="px-3 py-2 text-right">Facturación (€)</th>
                  <th className="px-3 py-2 text-right">Comisión KAM (€)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.name} className="odd:bg-white even:bg-indigo-50/50">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right">{r.pcrSold}</td>
                    <td className="px-3 py-2 text-right">{r.paiaSold}</td>
                    <td className="px-3 py-2 text-right">
                      {parseFloat(r.fact).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right text-pink-600 font-medium">
                      {parseFloat(r.kamEarn).toLocaleString("es-ES", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-indigo-100 font-semibold text-indigo-800">
                <tr>
                  <td className="px-3 py-2">TOTAL</td>
                  <td></td>
                  <td></td>
                  <td className="px-3 py-2 text-right">
                    {totalFact.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totalKAM.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    })}
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
