import { onlyDigitsMax, onlyText } from "../../../../utils";

interface ApplyTextInputFiltersOptions {
  numericOnly: boolean;
  textOnly: boolean;
  allowHyphen: boolean;
  maxDigits?: number;
}

/**
 * Aplica los filtros de texto de InputField preservando el comportamiento original.
 */
export function applyTextInputFilters(
  value: string,
  options: ApplyTextInputFiltersOptions,
): string {
  let nextValue = value;

  if (options.numericOnly) {
    nextValue = onlyDigitsMax(nextValue, options.maxDigits);
  }

  if (options.textOnly) {
    nextValue = onlyText(nextValue, { allowHyphen: options.allowHyphen });
  }

  return nextValue;
}
