/**
 * Genera estilos de foco según el estado de validación.
 */
export function getFocusStyles(isInvalid: boolean) {
  if (isInvalid) {
    return {
      outline: "2px solid",
      outlineColor: "red.600",
    } as const;
  }

  return {
    outline: "1px solid",
    outlineColor: "brand.blue.100",
  } as const;
}
