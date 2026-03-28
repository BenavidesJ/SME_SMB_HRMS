import { formatCurrencyInputValue } from "../../../../utils";

/**
 * Aplica la máscara monetaria con precisión decimal configurable.
 */
export function getCurrencyMaskedValue(value: string, maxDecimals: number): string {
  return formatCurrencyInputValue(value, { maxDecimals });
}
