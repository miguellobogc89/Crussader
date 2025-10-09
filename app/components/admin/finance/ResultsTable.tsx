"use client";

import React from "react";

const formatEUR = (value: number) =>
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

type Row = {
  name: string;
  pcrUnits: number;
  paiaUnits: number;
  importePCR: number;
  importePAIA: number;
  fact: number;
  kamEarn: number;
  accUnits: number;
  accImporte: number;
  // métricas empresa (ya calculadas en la page)
  empresaMes: number;             // facturación del mes - KAM
  beneficioEmpresaMes: number;    // empresaMes * 0.75
  pctKamOverBeneficio: number;    // KAM / beneficioEmpresaMes
};

type Totals = {
  totalPcrUnits: number;
  totalPaiaUnits: number;
  totalImportePCR: number;
  totalImportePAIA: number;
  totalAccUnits: number;
  totalAccImporte: number;
  totalEmpresaMes: number;
  totalBeneficioEmpresaMes: number;
  totalKam: number;
  pctKamOverBeneficio: number;
};

export default function ResultsTable({ data, totals }: { data: Row[]; totals: Totals }) {
  const num = "px-3 py-2 text-center";

  return (
    <div className="overflow-x-auto mt-10">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-indigo-100 text-indigo-800">
          <tr>
            <th className="px-3 py-2 text-left">Mes</th>
            <th className={num}>uds PCR</th>
            <th className={num}>Importe PCR</th>
            <th className={num}>uds PAIA</th>
            <th className={num}>Importe PAIA</th>
            <th className={num}>uds Acumuladas</th>
            <th className={num}>Importe acumulado</th>
            {/* nuevas columnas antes de KAM */}
            <th className={num}>Empresa (mes)</th>
            <th className={num}>Beneficio empresa (mes)</th>
            <th className={num}>% KAM / Beneficio</th>
            {/* KAM al final */}
            <th className={num}>Renta KAM (mes)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.name} className="odd:bg-white even:bg-indigo-50/50">
              <td className="px-3 py-2">{r.name}</td>
              <td className={num}>{r.pcrUnits.toLocaleString("es-ES")}</td>
              <td className={num}>{formatEUR(r.importePCR)}</td>
              <td className={num}>{r.paiaUnits.toLocaleString("es-ES")}</td>
              <td className={num}>{formatEUR(r.importePAIA)}</td>
              <td className={num}>{r.accUnits.toLocaleString("es-ES")}</td>
              <td className={num}>{formatEUR(r.accImporte)}</td>

              {/* columnas corregidas */}
              <td className={num}>{formatEUR(r.empresaMes)}</td>
              <td className={num}>{formatEUR(r.beneficioEmpresaMes)}</td>
              <td className={`${num} text-fuchsia-700 font-medium`}>
                {r.pctKamOverBeneficio.toLocaleString("es-ES", {
                  style: "percent",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
              <td className={`${num} text-pink-600 font-medium`}>{formatEUR0(r.kamEarn)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-indigo-100 font-semibold text-indigo-800">
          <tr>
            <td className="px-3 py-2">TOTAL</td>
            <td className={num}>{totals.totalPcrUnits.toLocaleString("es-ES")}</td>
            <td className={num}>{formatEUR(totals.totalImportePCR)}</td>
            <td className={num}>{totals.totalPaiaUnits.toLocaleString("es-ES")}</td>
            <td className={num}>{formatEUR(totals.totalImportePAIA)}</td>
            <td className={num}>{totals.totalAccUnits.toLocaleString("es-ES")}</td>
            <td className={num}>{formatEUR(totals.totalAccImporte)}</td>
            <td className={num}>{formatEUR(totals.totalEmpresaMes)}</td>
            <td className={num}>{formatEUR(totals.totalBeneficioEmpresaMes)}</td>
            <td className={`${num} text-fuchsia-700`}>
              {totals.pctKamOverBeneficio.toLocaleString("es-ES", {
                style: "percent",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </td>
            <td className={num}>{formatEUR0(totals.totalKam)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
