"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmployeeRow = {
  id: string;
  name: string;
  active: boolean;
  // rol primario para mostrar en la tabla
  roleName?: string | null;
  roleColor?: string | null;
  // datos completos de roles para el modal
  roleIds?: string[];
  roleNames?: string[];
};

type Props = {
  locationId: string;
  disabled?: boolean;
  className?: string;
  onRowClick?: (employee: EmployeeRow) => void;
  onRefreshed?: (rows: EmployeeRow[]) => void;
};

export default function EmployeesTable({
  locationId,
  disabled = false,
  className,
  onRowClick,
  onRefreshed,
}: Props) {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const parsePrimaryRole = (e: any): { roleName?: string | null; roleColor?: string | null } => {
    if (Array.isArray(e?.roles) && e.roles.length) {
      const primary = e.roles.find((r: any) => r?.isPrimary) ?? e.roles[0];
      return {
        roleName: primary?.role?.name ?? primary?.roleName ?? null,
        roleColor: primary?.role?.color ?? primary?.roleColor ?? null,
      };
    }
    if (e?.primaryRoleName) return { roleName: String(e.primaryRoleName), roleColor: e?.primaryRoleColor ?? null };
    if (e?.primary_role_name) return { roleName: String(e.primary_role_name), roleColor: e?.primary_role_color ?? null };
    return { roleName: null, roleColor: null };
  };

  const fetchEmployees = async () => {
    if (!locationId) {
      setRows([]);
      setMsg("Selecciona una ubicación");
      return;
    }
    setLoading(true);
    setMsg("Cargando usuarios…");
    try {
      const res = await fetch(`/api/calendar/employees?locationId=${encodeURIComponent(locationId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setRows([]);
        setMsg(`❌ ${data.error || "Error"}`);
        return;
      }
      const items: EmployeeRow[] = Array.isArray(data.items)
        ? data.items.map((e: any) => {
            const { roleName, roleColor } = parsePrimaryRole(e);
            const roleIds = Array.isArray(e?.roles) ? e.roles.map((r: any) => String(r?.role?.id ?? r?.roleId)).filter(Boolean) : [];
            const roleNames = Array.isArray(e?.roles) ? e.roles.map((r: any) => String(r?.role?.name ?? r?.roleName)).filter(Boolean) : [];
            return {
              id: String(e.id),
              name: String(e.name ?? ""),
              active: Boolean(e.active),
              roleName,
              roleColor,
              roleIds,
              roleNames,
            };
          })
        : [];
      setRows(items);
      setMsg(items.length ? `✅ ${items.length} usuarios` : "Sin usuarios");
      onRefreshed?.(items);
    } catch (e: any) {
      setRows([]);
      setMsg(`❌ ${e?.message || "Error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const RoleBadge = ({ name, color }: { name?: string | null; color?: string | null }) => {
    if (!name) return <Badge variant="outline">—</Badge>;
    const style = color ? { backgroundColor: color, color: "#fff", borderColor: "transparent" } : undefined;
    return (
      <Badge style={style} className="font-medium">
        {name}
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="text-sm text-muted-foreground">{msg}</div>
          <Button variant="outline" size="sm" onClick={fetchEmployees} disabled={disabled || loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Nombre</th>
                <th className="px-4 py-2 text-left font-medium">Rol</th>
                <th className="px-4 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4" colSpan={3}>Cargando…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={3}>No hay usuarios en esta ubicación.</td>
                </tr>
              ) : (
                rows.map((u) => (
                  <tr
                    key={u.id}
                    className={cn(
                      "border-t cursor-pointer select-none",
                      "hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                    )}
                    tabIndex={0}
                    onClick={() => onRowClick?.(u)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick?.(u);
                      }
                    }}
                    aria-label={`Editar ${u.name}`}
                  >
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">
                      <RoleBadge name={u.roleName} color={u.roleColor ?? undefined} />
                    </td>
                    <td className="px-4 py-2">
                      {u.active ? <Badge variant="default">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
