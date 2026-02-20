// lib/permissions.ts
export function can(user: { role: string }, permission: string): boolean {
  if (user.role === "system_admin") return true;

  const map: Record<string, string[]> = {
    "company.switch": ["owner", "admin"],
    "reviews.write": ["owner", "admin"],
    "company.read": ["owner", "admin", "member"],
  };

  return map[permission]?.includes(user.role) ?? false;
}
