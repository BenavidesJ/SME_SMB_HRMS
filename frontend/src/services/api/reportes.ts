export type ReporteCatalogItem = {
  key: string;
  label: string;
};

export type ReporteColumn = {
  key: string;
  label: string;
};

export type ReportePagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type ReporteDataResponse = {
  key: string;
  label: string;
  generatedAt: string;
  columns: ReporteColumn[];
  selectedColumns: string[];
  rows: Array<Record<string, string | number | null>>;
  pagination: ReportePagination;
  summary?: Record<string, unknown>;
  notes?: string[];
};

export type ReporteQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  idPeriodo?: number;
  idColaborador?: number;
  idDepartamento?: number;
  columns?: string[];
};

export const REPORTES_CATALOGO_URL = "/reportes";

export function buildReporteDataUrl(reporteKey: string, params: ReporteQueryParams = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (key === "columns" && Array.isArray(value)) {
      if (value.length > 0) searchParams.set("columns", value.join(","));
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `/reportes/${reporteKey}?${queryString}` : `/reportes/${reporteKey}`;
}
