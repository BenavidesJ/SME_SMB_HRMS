export const normalizeDaysString = (value: unknown) => {
  if (Array.isArray(value)) return value.join("");

  return String(value ?? "").trim().toUpperCase();
};