//app/components/slots/configuration/Admin/admin.types.ts
export type AdminTabKey = "employees" | "clients";

export type EmployeeItem = {
  id: string;
  name: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  color: string;
  isPrimary?: boolean;
  active?: boolean;
  email?: string;
  phone?: string;
  invitedAt?: string | null;
  joinedAt?: string | null;
};

export type NewEmployeeForm = {
  title: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  color: string;
  email: string;
  phone: string;
};

export type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  locationId: string;
};

export const EMPLOYEE_COLORS = [
  "#0B6CF4",
  "#2563EB",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#84CC16",
  "#EAB308",
  "#F59E0B",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#D946EF",
  "#8B5CF6",
  "#6366F1",
  "#64748B",
  "#0F172A",
];

export function normalizeText(value: string): string {
  return value.trim();
}

export function buildInitialEmployeeForm(): NewEmployeeForm {
  return {
    title: "",
    firstName: "",
    lastName: "",
    name: "",
    role: "",
    color: "#0B6CF4",
    email: "",
    phone: "",
  };
}