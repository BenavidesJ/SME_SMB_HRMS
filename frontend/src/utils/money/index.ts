export const formatCRC = (value: number | string): string => {
  const data =
    typeof value === "string"
      ? Number(value.replace(/,/g, "").trim())
      : value;

  if (!Number.isFinite(data)) {
    return "₡0,00";
  }

  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(data);
};

type CurrencyInputOptions = {
  maxDecimals?: number;
};

const addThousandsSeparator = (value: string) =>
  value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const formatCurrencyInputValue = (
  value: unknown,
  options: CurrencyInputOptions = {},
): string => {
  const maxDecimals = Math.max(0, options.maxDecimals ?? 2);
  const rawValue = String(value ?? "").replace(/,/g, "").trim();

  if (!rawValue) return "";

  const cleaned = rawValue.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const hasDecimalPoint = cleaned.includes(".");
  const [rawIntegerPart = "", ...rawDecimalParts] = cleaned.split(".");
  const integerDigits = rawIntegerPart.replace(/^0+(?=\d)/, "") || "0";
  const decimalDigits = rawDecimalParts.join("").slice(0, maxDecimals);
  const formattedInteger = addThousandsSeparator(integerDigits);

  if (!hasDecimalPoint) return formattedInteger;
  if (maxDecimals === 0) return formattedInteger;

  return `${formattedInteger}.${decimalDigits}`;
};

export const parseCurrencyInputValue = (value: unknown): number | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw.replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};
