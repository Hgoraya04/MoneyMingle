export function money(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function monthYear(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
