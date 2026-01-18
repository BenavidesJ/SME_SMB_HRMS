export const normalizeTimeToHHMMSS = (t: unknown) => {
  const s = String(t ?? "").trim();
  if (!s) return "";
  return s.length === 5 ? `${s}:00` : s; // "08:00" -> "08:00:00"
};
