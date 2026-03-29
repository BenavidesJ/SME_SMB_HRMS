import { models } from "../../../../models/index.js";
import { resolveActorFromToken } from "../../shared/resolveActor.js";
import { toNumber } from "../../shared/formatters.js";

const { Planilla, PeriodoPlanilla, Estado } = models;

const ALLOWED_SORT_FIELDS = new Set([
  "id_periodo",
  "fecha_inicio",
  "fecha_fin",
  "fecha_pago",
  "estado",
  "bruto",
  "deducciones",
  "neto",
  "horas_extra",
]);

function parseQuery(rawQuery = {}) {
  const page = Math.max(1, parseInt(rawQuery.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(rawQuery.limit ?? "10", 10) || 10));
  const sortDir = String(rawQuery.sortDir ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const requestedSortBy = String(rawQuery.sortBy ?? "fecha_fin").trim();
  const sortBy = ALLOWED_SORT_FIELDS.has(requestedSortBy) ? requestedSortBy : "fecha_fin";
  const search = String(rawQuery.search ?? "").trim().toLowerCase();
  const monthRaw = String(rawQuery.month ?? "").trim();
  const yearRaw = String(rawQuery.year ?? "").trim();

  const month = /^\d{2}$/.test(monthRaw)
    && Number(monthRaw) >= 1
    && Number(monthRaw) <= 12
    ? monthRaw
    : "";
  const year = /^\d{4}$/.test(yearRaw) ? yearRaw : "";

  return { page, limit, sortBy, sortDir, search, month, year };
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compareValues(a, b, sortDir) {
  if (typeof a === "number" && typeof b === "number") {
    return sortDir === "asc" ? a - b : b - a;
  }

  const left = normalizeText(a);
  const right = normalizeText(b);
  if (left === right) return 0;

  if (sortDir === "asc") {
    return left > right ? 1 : -1;
  }

  return left < right ? 1 : -1;
}

function getReferenceDate(row) {
  return row.fecha_pago || row.fecha_fin || row.fecha_inicio || "";
}

function getMonthValue(row) {
  const referenceDate = getReferenceDate(row);
  return /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
    ? referenceDate.slice(5, 7)
    : "";
}

function getYearValue(row) {
  const referenceDate = getReferenceDate(row);
  return /^\d{4}-\d{2}-\d{2}$/.test(referenceDate)
    ? referenceDate.slice(0, 4)
    : "";
}

export async function listarMisPlanillas({ tokenId, query = {} }) {
  const actor = await resolveActorFromToken(tokenId);
  const parsedQuery = parseQuery(query);

  const registros = await Planilla.findAll({
    where: { id_colaborador: actor.id_colaborador },
    include: [
      {
        model: PeriodoPlanilla,
        as: "periodo",
        attributes: ["id_periodo", "fecha_inicio", "fecha_fin", "fecha_pago"],
        include: [
          {
            model: Estado,
            as: "estadoRef",
            attributes: ["estado"],
            required: false,
          },
        ],
      },
    ],
    order: [["id_detalle", "DESC"]],
  });

  const rows = registros.map((registro) => ({
    id_detalle: Number(registro.id_detalle),
    id_periodo: Number(registro.id_periodo),
    fecha_inicio: registro.periodo?.fecha_inicio ?? null,
    fecha_fin: registro.periodo?.fecha_fin ?? null,
    fecha_pago: registro.periodo?.fecha_pago ?? null,
    estado: registro.periodo?.estadoRef?.estado ?? "N/D",
    horas_ordinarias: toNumber(registro.horas_ordinarias),
    horas_extra: toNumber(registro.horas_extra),
    horas_nocturnas: toNumber(registro.horas_nocturnas),
    horas_feriado: toNumber(registro.horas_feriado),
    bruto: toNumber(registro.bruto),
    deducciones: toNumber(registro.deducciones),
    neto: toNumber(registro.neto),
  }));

  const filteredRows = rows.filter((row) => {
    if (parsedQuery.search) {
      const searchable = [
        row.id_periodo,
        row.fecha_inicio,
        row.fecha_fin,
        row.fecha_pago,
        row.estado,
        row.bruto,
        row.neto,
      ]
        .map((value) => normalizeText(value))
        .join(" ");

      if (!searchable.includes(normalizeText(parsedQuery.search))) {
        return false;
      }
    }

    if (parsedQuery.month && getMonthValue(row) !== parsedQuery.month) {
      return false;
    }

    if (parsedQuery.year && getYearValue(row) !== parsedQuery.year) {
      return false;
    }

    return true;
  });

  const sortedRows = [...filteredRows].sort((left, right) => {
    const result = compareValues(left[parsedQuery.sortBy], right[parsedQuery.sortBy], parsedQuery.sortDir);
    if (result !== 0) return result;
    return compareValues(left.fecha_fin ?? "", right.fecha_fin ?? "", "desc");
  });

  const total = sortedRows.length;
  const pages = Math.max(1, Math.ceil(total / parsedQuery.limit));
  const safePage = Math.min(parsedQuery.page, pages);
  const startIndex = (safePage - 1) * parsedQuery.limit;
  const items = sortedRows.slice(startIndex, startIndex + parsedQuery.limit);

  return {
    items,
    pagination: {
      total,
      page: safePage,
      limit: parsedQuery.limit,
      pages,
    },
    summary: {
      total_bruto: Number(sortedRows.reduce((acc, row) => acc + row.bruto, 0).toFixed(2)),
      total_neto: Number(sortedRows.reduce((acc, row) => acc + row.neto, 0).toFixed(2)),
      total_periodos: total,
    },
  };
}