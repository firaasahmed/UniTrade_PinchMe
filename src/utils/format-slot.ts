const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// "2026-08-02T10:00" -> "Sat 2 Aug, 10:00am" — parsed by parts so no timezone can shift it
export function formatSlot(at: string): string {
  const [date, time] = at.split("T");
  if (!date || !time) return at;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (y === undefined || m === undefined || d === undefined) return at;

  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()] ?? "";
  const month = MONTHS[m - 1] ?? "";
  return `${weekday} ${d} ${month}, ${formatTime(hh ?? 0, mm ?? 0)}`;
}

export function formatTime(hh: number, mm: number): string {
  const suffix = hh < 12 ? "am" : "pm";
  const hour = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour}:${String(mm).padStart(2, "0")}${suffix}`;
}

// "10:00" -> "10:00am"
export function formatSlotTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  return formatTime(hh ?? 0, mm ?? 0);
}
