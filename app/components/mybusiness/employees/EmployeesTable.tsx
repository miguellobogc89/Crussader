// app/components/mybusiness/employees/EmployeesTable.tsx
"use client";

import type { EmployeeItem } from "../core/MyBusinessWorkspace";

type Props = {
  employees: EmployeeItem[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (employeeId: string) => void;
};

export default function EmployeesTable({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
}: Props) {
  return (
    <table className="w-full min-w-[980px] text-left text-sm">
      <thead className="sticky top-0 z-10 border-b bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">Empleado</th>
          <th className="px-4 py-3">Cargo</th>
          <th className="px-4 py-3">Color</th>
          <th className="px-4 py-3">Ubicaciones</th>
          <th className="px-4 py-3">Servicios</th>
          <th className="px-4 py-3">Acceso plataforma</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {employees.map((employee) => {
          const isSelected = selectedEmployeeId === employee.id;

          return (
            <tr
              key={employee.id}
              onClick={() => onSelectEmployee(employee.id)}
              className={[
                "cursor-pointer transition",
                isSelected ? "bg-blue-50" : "hover:bg-slate-50",
              ].join(" ")}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">
                  {[employee.title, employee.firstName, employee.lastName]
                    .filter(Boolean)
                    .join(" ") || employee.name}
                </div>

                <div className="text-xs text-slate-500">
                  {employee.email ?? employee.phone ?? "Sin contacto"}
                </div>
              </td>

              <td className="px-4 py-3 text-slate-600">
                {employee.jobTitle ?? "Sin cargo"}
              </td>

              <td className="px-4 py-3">
                <div
                  className="h-5 w-5 rounded-full border border-slate-200"
                  style={{ backgroundColor: employee.color ?? "#cbd5e1" }}
                />
              </td>

              <td className="px-4 py-3 text-slate-600">
                {employee.locations.length > 0
                  ? employee.locations.map((location) => location.title).join(", ")
                  : "Sin ubicación"}
              </td>

              <td className="px-4 py-3 text-slate-600">
                {employee.services.length > 0
                  ? `${employee.services.length} servicios`
                  : "Sin servicios"}
              </td>

              <td className="px-4 py-3">
                {employee.joinedAt ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    Registrado
                  </span>
                ) : employee.invitedAt ? (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    Invitación enviada
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    Sin acceso
                  </span>
                )}
              </td>
            </tr>
          );
        })}

        {employees.length === 0 && (
          <tr>
            <td
              colSpan={6}
              className="px-4 py-8 text-center text-sm text-slate-500"
            >
              No hay empleados todavía.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}