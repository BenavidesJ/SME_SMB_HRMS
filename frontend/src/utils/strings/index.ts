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

export const textOnlyPattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
export const textOnlyPatternMessage = "Solo se permiten letras y espacios";

export const textWithHyphenPattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]+$/;
export const textWithHyphenPatternMessage = "Solo se permiten letras, espacios y guiones";

export const onlyDigits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

export const onlyText = (
  value: unknown,
  options?: { allowHyphen?: boolean },
) => {
  const allowHyphen = options?.allowHyphen ?? false;
  const pattern = allowHyphen ? /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s-]/g : /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g;
  return String(value ?? "").replace(pattern, "");
};

export const onlyDigitsMax = (value: unknown, maxDigits?: number) => {
  const normalized = onlyDigits(value);
  if (typeof maxDigits !== "number") return normalized;
  return normalized.slice(0, maxDigits);
};
