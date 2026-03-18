export const PERSONAL_REQUEST_COLUMNS = [
  { key: "PENDIENTE", title: "Pendientes" },
  { key: "RECHAZADO", title: "Rechazadas" },
  { key: "APROBADO", title: "Aprobadas" },
] as const;

export const ADMIN_REQUEST_STATUS_ORDER = ["PENDIENTE", "RECHAZADO", "APROBADO", "CANCELADO"] as const;

export const normalizeRequestStatus = (value?: string | null) => String(value ?? "").trim().toUpperCase();

const toTimestamp = (value?: string | null) => {
  const timestamp = new Date(String(value ?? "")).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export function sortRequestsByAdminPriority<T>(
  items: T[],
  getStatus: (item: T) => string | null | undefined,
  getDate: (item: T) => string | null | undefined,
) {
  const priorityMap = new Map<string, number>(ADMIN_REQUEST_STATUS_ORDER.map((status, index) => [status, index]));

  return [...items].sort((left, right) => {
    const leftPriority = priorityMap.get(normalizeRequestStatus(getStatus(left))) ?? 99;
    const rightPriority = priorityMap.get(normalizeRequestStatus(getStatus(right))) ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return toTimestamp(getDate(right)) - toTimestamp(getDate(left));
  });
}