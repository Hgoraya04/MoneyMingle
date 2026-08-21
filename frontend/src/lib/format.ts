export function money(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// Goal/transaction dates are calendar dates, not moments in time — format them
// in UTC so "2026-08-15" always reads as Aug 15, regardless of the viewer's timezone.
export function monthYear(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function insufficientFundsMessage(goalName: string, available: number): string {
  return available <= 0 ? `${goalName} doesn't have any money left to withdraw.` : `Only ${money(available)} available in ${goalName}.`;
}
