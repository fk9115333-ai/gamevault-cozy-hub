export const hijri = (date: string | Date | null) => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "—";
  }
};

export const gregorian = (date: string | Date | null) => {
  if (!date) return "غير معلن";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "غير معلن";
  return new Intl.DateTimeFormat("ar", { day: "numeric", month: "long", year: "numeric" }).format(
    d,
  );
};

export const num = (n: number, digits = 0) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: digits }).format(n);

export const countdown = (target: string | null, now: number) => {
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff) || diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
};
