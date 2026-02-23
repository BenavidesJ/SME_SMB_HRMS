export const toTitleCase = (s: string) =>
  s
    .toLocaleLowerCase("es")
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toLocaleUpperCase("es") +
        word.slice(1)
    )
    .join(" ");

export const usernamePattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}\d{4}$/;
export const usernamePatternMessage = "Formato inválido. Use inicial del nombre + primer apellido + últimos 4 dígitos de su cédula.";

export const onlyDigits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

export const onlyDigitsMax = (value: unknown, maxDigits?: number) => {
  const normalized = onlyDigits(value);
  if (typeof maxDigits !== "number") return normalized;
  return normalized.slice(0, maxDigits);
};
