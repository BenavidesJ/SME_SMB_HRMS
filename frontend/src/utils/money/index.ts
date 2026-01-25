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
