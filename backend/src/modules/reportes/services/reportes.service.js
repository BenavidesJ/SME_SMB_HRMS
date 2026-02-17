import { Op } from "sequelize";
import {
  Colaborador,
  Contrato,
  Departamento,
  Estado,
  Incapacidad,
  JornadaDiaria,
  Liquidacion,
  PeriodoPlanilla,
  Planilla,
  Puesto,
  SaldoVacaciones,
  TipoContrato,
  TipoIncapacidad,
  TipoJornada,
  sequelize,
} from "../../../models/index.js";

export const REPORTS_CATALOG = [
  { key: "planilla_resumen_periodo", label: "Resumen de planilla por período" },
  { key: "planilla_detalle_colaborador", label: "Detalle de planilla por colaborador" },
  { key: "horas_trabajadas", label: "Reporte de horas trabajadas" },
  { key: "ausentismo", label: "Reporte de ausentismo" },
  { key: "ranking_horas_extra", label: "Ranking de horas extra" },
  { key: "saldo_vacaciones_colaborador", label: "Saldo de vacaciones por colaborador" },
  { key: "provision_vacaciones", label: "Provisión contable de vacaciones" },
  { key: "contratos_activos", label: "Reporte de contratos activos" },
  { key: "rotacion_personal", label: "Rotación de personal" },
  { key: "tendencia_incapacidades", label: "Tendencia de incapacidades" },
];

const REPORT_COLUMNS = {
  planilla_resumen_periodo: [
    { key: "id_periodo", label: "Período" },
    { key: "fecha_inicio", label: "Fecha inicio" },
    { key: "fecha_fin", label: "Fecha fin" },
    { key: "fecha_pago", label: "Fecha pago" },
    { key: "total_bruto", label: "Total bruto" },
    { key: "total_deducciones", label: "Total deducciones" },
    { key: "total_neto", label: "Total neto" },
    { key: "aportes_patronales", label: "Aportes patronales" },
    { key: "costo_total_empresa", label: "Costo total empresa" },
    { key: "variacion_vs_anterior_pct", label: "% variación vs período anterior" },
  ],
  planilla_detalle_colaborador: [
    { key: "id_detalle", label: "ID detalle" },
    { key: "id_periodo", label: "Período" },
    { key: "colaborador", label: "Colaborador" },
    { key: "departamento", label: "Departamento" },
    { key: "salario_base", label: "Salario base" },
    { key: "horas_ordinarias", label: "Horas ordinarias" },
    { key: "horas_extra", label: "Horas extra" },
    { key: "horas_feriado", label: "Horas feriado" },
    { key: "incapacidades", label: "Incapacidades" },
    { key: "vacaciones_pagadas", label: "Vacaciones pagadas" },
    { key: "deducciones", label: "Deducciones" },
    { key: "neto_final", label: "Neto final" },
  ],
  horas_trabajadas: [
    { key: "id_colaborador", label: "ID colaborador" },
    { key: "colaborador", label: "Colaborador" },
    { key: "horas_ordinarias", label: "Horas ordinarias" },
    { key: "horas_extra", label: "Horas extra" },
    { key: "horas_nocturnas", label: "Horas nocturnas" },
    { key: "horas_feriado", label: "Horas feriado" },
  ],
  ausentismo: [
    { key: "id_colaborador", label: "ID colaborador" },
    { key: "colaborador", label: "Colaborador" },
    { key: "dias_no_laborados", label: "Días no laborados" },
    { key: "incapacidades", label: "Incapacidades" },
    { key: "permisos", label: "Permisos" },
    { key: "ausencias_injustificadas", label: "Ausencias injustificadas" },
  ],
  ranking_horas_extra: [
    { key: "tipo", label: "Tipo ranking" },
    { key: "ranking", label: "Posición" },
    { key: "nombre", label: "Nombre" },
    { key: "departamento", label: "Departamento" },
    { key: "horas_extra", label: "Horas extra" },
  ],
  saldo_vacaciones_colaborador: [
    { key: "id_colaborador", label: "ID colaborador" },
    { key: "colaborador", label: "Colaborador" },
    { key: "acumuladas", label: "Acumuladas" },
    { key: "disfrutadas", label: "Disfrutadas" },
    { key: "pendientes", label: "Pendientes" },
    { key: "proximas_vencer", label: "Próximas a vencer" },
  ],
  provision_vacaciones: [
    { key: "id_colaborador", label: "ID colaborador" },
    { key: "colaborador", label: "Colaborador" },
    { key: "salario_base", label: "Salario base" },
    { key: "dias_pendientes", label: "Días pendientes" },
    { key: "provision", label: "Provisión" },
  ],
  contratos_activos: [
    { key: "id_contrato", label: "ID contrato" },
    { key: "colaborador", label: "Colaborador" },
    { key: "tipo_contrato", label: "Tipo contrato" },
    { key: "jornada", label: "Jornada" },
    { key: "departamento", label: "Departamento" },
    { key: "fecha_inicio", label: "Fecha inicio" },
    { key: "fecha_vencimiento", label: "Fecha vencimiento" },
    { key: "estado", label: "Estado" },
  ],
  rotacion_personal: [
    { key: "mes", label: "Mes" },
    { key: "ingresos", label: "Ingresos" },
    { key: "salidas", label: "Salidas" },
    { key: "dotacion_promedio", label: "Dotación promedio" },
    { key: "tasa_rotacion", label: "Tasa rotación (%)" },
  ],
  tendencia_incapacidades: [
    { key: "mes", label: "Mes" },
    { key: "tipo_incapacidad", label: "Tipo incapacidad" },
    { key: "colaborador", label: "Colaborador" },
    { key: "dias", label: "Días" },
    { key: "porcentaje_tipo_mes", label: "% tipo (mes)" },
    { key: "porcentaje_colaborador_mes", label: "% colaborador (mes)" },
  ],
};

const ALLOWED_SORT_COLUMNS = {
  planilla_resumen_periodo: new Set(["id_periodo", "fecha_inicio", "fecha_fin", "fecha_pago", "total_bruto", "total_deducciones", "total_neto", "aportes_patronales", "costo_total_empresa", "variacion_vs_anterior_pct"]),
  planilla_detalle_colaborador: new Set(["id_detalle", "id_periodo", "colaborador", "departamento", "salario_base", "horas_ordinarias", "horas_extra", "horas_feriado", "incapacidades", "vacaciones_pagadas", "deducciones", "neto_final"]),
  horas_trabajadas: new Set(["colaborador", "horas_ordinarias", "horas_extra", "horas_nocturnas", "horas_feriado"]),
  ausentismo: new Set(["colaborador", "dias_no_laborados", "incapacidades", "permisos", "ausencias_injustificadas"]),
  ranking_horas_extra: new Set(["tipo", "ranking", "nombre", "departamento", "horas_extra"]),
  saldo_vacaciones_colaborador: new Set(["colaborador", "acumuladas", "disfrutadas", "pendientes", "proximas_vencer"]),
  provision_vacaciones: new Set(["colaborador", "salario_base", "dias_pendientes", "provision"]),
  contratos_activos: new Set(["id_contrato", "colaborador", "tipo_contrato", "jornada", "departamento", "fecha_inicio", "estado"]),
  rotacion_personal: new Set(["mes", "ingresos", "salidas", "dotacion_promedio", "tasa_rotacion"]),
  tendencia_incapacidades: new Set(["mes", "tipo_incapacidad", "colaborador", "dias", "porcentaje_tipo_mes", "porcentaje_colaborador_mes"]),
};

export function parseReportQuery(rawQuery = {}) {
  const page = Math.max(1, parseInt(rawQuery.page ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(rawQuery.limit ?? "10", 10) || 10));
  const sortDir = String(rawQuery.sortDir ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const columns = String(rawQuery.columns ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  let filters = {};
  if (rawQuery.filters) {
    try {
      filters = JSON.parse(String(rawQuery.filters));
    } catch {
      filters = {};
    }
  }

  return {
    page,
    limit,
    sortBy: rawQuery.sortBy ? String(rawQuery.sortBy) : undefined,
    sortDir,
    columns,
    search: rawQuery.search ? String(rawQuery.search).trim() : "",
    dateFrom: rawQuery.dateFrom ? String(rawQuery.dateFrom) : undefined,
    dateTo: rawQuery.dateTo ? String(rawQuery.dateTo) : undefined,
    idPeriodo: rawQuery.idPeriodo ? parseInt(String(rawQuery.idPeriodo), 10) : undefined,
    idColaborador: rawQuery.idColaborador ? parseInt(String(rawQuery.idColaborador), 10) : undefined,
    idDepartamento: rawQuery.idDepartamento ? parseInt(String(rawQuery.idDepartamento), 10) : undefined,
    includeInactivos: String(rawQuery.includeInactivos ?? "false") === "true",
    filters,
  };
}

export async function getReporteData(reporteKey, query) {
  const handlers = {
    planilla_resumen_periodo: getPlanillaResumenPeriodo,
    planilla_detalle_colaborador: getPlanillaDetalleColaborador,
    horas_trabajadas: getHorasTrabajadas,
    ausentismo: getAusentismo,
    ranking_horas_extra: getRankingHorasExtra,
    saldo_vacaciones_colaborador: getSaldoVacacionesColaborador,
    provision_vacaciones: getProvisionVacaciones,
    contratos_activos: getContratosActivos,
    rotacion_personal: getRotacionPersonal,
    tendencia_incapacidades: getTendenciaIncapacidades,
  };

  const data = await handlers[reporteKey](query);
  const availableColumns = REPORT_COLUMNS[reporteKey] ?? [];

  return {
    key: reporteKey,
    label: REPORTS_CATALOG.find((report) => report.key === reporteKey)?.label ?? reporteKey,
    generatedAt: new Date().toISOString(),
    columns: availableColumns,
    selectedColumns: resolveSelectedColumns(query.columns, availableColumns),
    ...data,
  };
}

function toNumber(value) {
  return Number.parseFloat(value ?? 0) || 0;
}

function formatName(colaborador) {
  if (!colaborador) return "N/D";
  return [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
    .filter(Boolean)
    .join(" ");
}

function getDateWhere(dateFrom, dateTo) {
  if (dateFrom && dateTo) return { [Op.between]: [dateFrom, dateTo] };
  if (dateFrom) return { [Op.gte]: dateFrom };
  if (dateTo) return { [Op.lte]: dateTo };
  return undefined;
}

function resolveSelectedColumns(requestedColumns, availableColumns) {
  if (!Array.isArray(requestedColumns) || requestedColumns.length === 0) {
    return availableColumns.map((column) => column.key);
  }

  const allowed = new Set(availableColumns.map((column) => column.key));
  const selected = requestedColumns.filter((column) => allowed.has(column));

  return selected.length > 0 ? selected : availableColumns.map((column) => column.key);
}

function applyColumnSelection(rows, selectedColumns) {
  return rows.map((row) => {
    const nextRow = {};
    selectedColumns.forEach((column) => {
      nextRow[column] = row[column];
    });
    return nextRow;
  });
}

function applyArraySort(rows, sortBy, sortDir, allowedSortColumns) {
  if (!sortBy || !allowedSortColumns.has(sortBy)) {
    return rows;
  }

  const direction = sortDir === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    if (leftValue === rightValue) return 0;
    if (leftValue === undefined || leftValue === null) return 1;
    if (rightValue === undefined || rightValue === null) return -1;

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue).localeCompare(String(rightValue), "es", { numeric: true }) * direction;
  });
}

function paginateRows(rows, page, limit) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pages);
  const offset = (safePage - 1) * limit;
  const paginatedRows = rows.slice(offset, offset + limit);

  return {
    rows: paginatedRows,
    pagination: {
      total,
      page: safePage,
      limit,
      pages,
    },
  };
}

function buildSuccessResponse(reporteKey, query, rows, extra = {}) {
  const selectedColumns = resolveSelectedColumns(query.columns, REPORT_COLUMNS[reporteKey]);
  const sortedRows = applyArraySort(rows, query.sortBy, query.sortDir, ALLOWED_SORT_COLUMNS[reporteKey]);
  const { rows: pagedRows, pagination } = paginateRows(sortedRows, query.page, query.limit);

  return {
    rows: applyColumnSelection(pagedRows, selectedColumns),
    pagination,
    summary: extra.summary ?? {},
    notes: extra.notes ?? [],
  };
}

async function getPlanillaResumenPeriodo(query) {
  const wherePeriodo = {};
  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) wherePeriodo.fecha_fin = dateWhere;

  if (query.idPeriodo) wherePeriodo.id_periodo = query.idPeriodo;

  const rows = await Planilla.findAll({
    attributes: [
      "id_periodo",
      [sequelize.fn("SUM", sequelize.col("bruto")), "total_bruto"],
      [sequelize.fn("SUM", sequelize.col("deducciones")), "total_deducciones"],
      [sequelize.fn("SUM", sequelize.col("neto")), "total_neto"],
    ],
    include: [
      {
        model: PeriodoPlanilla,
        as: "periodo",
        attributes: ["id_periodo", "fecha_inicio", "fecha_fin", "fecha_pago"],
        required: true,
        ...(Object.keys(wherePeriodo).length > 0 ? { where: wherePeriodo } : {}),
      },
    ],
    group: ["id_periodo", "periodo.id_periodo", "periodo.fecha_inicio", "periodo.fecha_fin", "periodo.fecha_pago"],
  });

  const normalized = rows
    .map((row) => {
      const totalBruto = toNumber(row.get("total_bruto"));
      const totalDeducciones = toNumber(row.get("total_deducciones"));
      const totalNeto = toNumber(row.get("total_neto"));
      const aportesPatronales = Number((totalBruto * 0.2667).toFixed(2));
      const costoTotalEmpresa = Number((totalBruto + aportesPatronales).toFixed(2));
      const periodo = row.periodo;

      return {
        id_periodo: row.id_periodo,
        fecha_inicio: periodo?.fecha_inicio ?? null,
        fecha_fin: periodo?.fecha_fin ?? null,
        fecha_pago: periodo?.fecha_pago ?? null,
        total_bruto: Number(totalBruto.toFixed(2)),
        total_deducciones: Number(totalDeducciones.toFixed(2)),
        total_neto: Number(totalNeto.toFixed(2)),
        aportes_patronales: aportesPatronales,
        costo_total_empresa: costoTotalEmpresa,
        variacion_vs_anterior_pct: 0,
      };
    })
    .sort((left, right) => String(left.fecha_fin).localeCompare(String(right.fecha_fin)));

  for (let index = 1; index < normalized.length; index += 1) {
    const previousCost = normalized[index - 1].costo_total_empresa;
    const currentCost = normalized[index].costo_total_empresa;

    normalized[index].variacion_vs_anterior_pct = previousCost > 0
      ? Number((((currentCost - previousCost) / previousCost) * 100).toFixed(2))
      : 0;
  }

  return buildSuccessResponse("planilla_resumen_periodo", query, normalized, {
    summary: {
      total_periodos: normalized.length,
      costo_total: Number(normalized.reduce((acc, row) => acc + row.costo_total_empresa, 0).toFixed(2)),
    },
  });
}

async function getPlanillaDetalleColaborador(query) {
  const wherePlanilla = {};
  if (query.idPeriodo) wherePlanilla.id_periodo = query.idPeriodo;
  if (query.idColaborador) wherePlanilla.id_colaborador = query.idColaborador;

  const wherePeriodo = {};
  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) wherePeriodo.fecha_fin = dateWhere;

  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const detalles = await Planilla.findAll({
    where: wherePlanilla,
    include: [
      {
        model: PeriodoPlanilla,
        as: "periodo",
        attributes: ["id_periodo", "fecha_inicio", "fecha_fin"],
        required: Object.keys(wherePeriodo).length > 0,
        ...(Object.keys(wherePeriodo).length > 0 ? { where: wherePeriodo } : {}),
      },
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
      {
        model: Contrato,
        as: "contrato",
        attributes: ["id_contrato", "salario_base"],
        required: false,
        include: [
          {
            model: Puesto,
            as: "puesto",
            attributes: ["id_puesto", "nombre"],
            required: false,
            include: [
              {
                model: Departamento,
                as: "departamento",
                attributes: ["id_departamento", "nombre"],
                required: false,
                ...(query.idDepartamento
                  ? { where: { id_departamento: query.idDepartamento } }
                  : {}),
              },
            ],
          },
        ],
      },
    ],
  });

  const incapacidadVacacionesByColaborador = new Map();

  if (query.idPeriodo && detalles.length > 0) {
    const periodo = detalles[0].periodo;
    if (periodo?.fecha_inicio && periodo?.fecha_fin) {
      const jornadas = await JornadaDiaria.findAll({
        attributes: [
          "id_colaborador",
          [sequelize.fn("SUM", sequelize.literal("CASE WHEN incapacidad IS NOT NULL THEN 1 ELSE 0 END")), "incapacidades"],
          [sequelize.fn("SUM", sequelize.literal("CASE WHEN vacaciones IS NOT NULL THEN 1 ELSE 0 END")), "vacaciones_pagadas"],
        ],
        where: {
          id_colaborador: {
            [Op.in]: Array.from(new Set(detalles.map((detalle) => detalle.id_colaborador))),
          },
          fecha: {
            [Op.between]: [periodo.fecha_inicio, periodo.fecha_fin],
          },
        },
        group: ["id_colaborador"],
      });

      jornadas.forEach((jornada) => {
        incapacidadVacacionesByColaborador.set(jornada.id_colaborador, {
          incapacidades: toNumber(jornada.get("incapacidades")),
          vacaciones_pagadas: toNumber(jornada.get("vacaciones_pagadas")),
        });
      });
    }
  }

  const rows = detalles.map((detalle) => {
    const extra = incapacidadVacacionesByColaborador.get(detalle.id_colaborador) ?? {
      incapacidades: 0,
      vacaciones_pagadas: 0,
    };

    return {
      id_detalle: detalle.id_detalle,
      id_periodo: detalle.id_periodo,
      colaborador: formatName(detalle.colaborador),
      departamento: detalle.contrato?.puesto?.departamento?.nombre ?? "N/D",
      salario_base: Number(toNumber(detalle.contrato?.salario_base).toFixed(2)),
      horas_ordinarias: Number(toNumber(detalle.horas_ordinarias).toFixed(2)),
      horas_extra: Number(toNumber(detalle.horas_extra).toFixed(2)),
      horas_feriado: Number(toNumber(detalle.horas_feriado).toFixed(2)),
      incapacidades: Number(toNumber(extra.incapacidades).toFixed(2)),
      vacaciones_pagadas: Number(toNumber(extra.vacaciones_pagadas).toFixed(2)),
      deducciones: Number(toNumber(detalle.deducciones).toFixed(2)),
      neto_final: Number(toNumber(detalle.neto).toFixed(2)),
    };
  });

  return buildSuccessResponse("planilla_detalle_colaborador", query, rows, {
    summary: {
      total_colaboradores: new Set(rows.map((row) => row.colaborador)).size,
      neto_total: Number(rows.reduce((acc, row) => acc + row.neto_final, 0).toFixed(2)),
    },
    notes: query.idPeriodo
      ? []
      : ["Incapacidades y vacaciones pagadas se calculan con mayor precisión cuando se filtra por idPeriodo."],
  });
}

async function getHorasTrabajadas(query) {
  const where = {};
  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) where.fecha = dateWhere;
  if (query.idColaborador) where.id_colaborador = query.idColaborador;

  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const grouped = await JornadaDiaria.findAll({
    attributes: [
      "id_colaborador",
      [sequelize.fn("SUM", sequelize.col("horas_ordinarias")), "horas_ordinarias"],
      [sequelize.fn("SUM", sequelize.col("horas_extra")), "horas_extra"],
      [sequelize.fn("SUM", sequelize.col("horas_nocturnas")), "horas_nocturnas"],
      [sequelize.fn("SUM", sequelize.literal("CASE WHEN feriado IS NOT NULL THEN (COALESCE(horas_ordinarias, 0) + COALESCE(horas_extra, 0)) ELSE 0 END")), "horas_feriado"],
    ],
    where,
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
    ],
    group: ["id_colaborador", "colaborador.id_colaborador", "colaborador.nombre", "colaborador.primer_apellido", "colaborador.segundo_apellido"],
  });

  const rows = grouped.map((item) => ({
    id_colaborador: item.id_colaborador,
    colaborador: formatName(item.colaborador),
    horas_ordinarias: Number(toNumber(item.get("horas_ordinarias")).toFixed(2)),
    horas_extra: Number(toNumber(item.get("horas_extra")).toFixed(2)),
    horas_nocturnas: Number(toNumber(item.get("horas_nocturnas")).toFixed(2)),
    horas_feriado: Number(toNumber(item.get("horas_feriado")).toFixed(2)),
  }));

  return buildSuccessResponse("horas_trabajadas", query, rows, {
    summary: {
      total_horas: Number(rows.reduce((acc, row) => acc + row.horas_ordinarias + row.horas_extra + row.horas_nocturnas, 0).toFixed(2)),
    },
  });
}

async function getAusentismo(query) {
  const where = {};
  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) where.fecha = dateWhere;
  if (query.idColaborador) where.id_colaborador = query.idColaborador;

  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const grouped = await JornadaDiaria.findAll({
    attributes: [
      "id_colaborador",
      [sequelize.fn("SUM", sequelize.literal("CASE WHEN COALESCE(horas_ordinarias, 0) = 0 AND COALESCE(horas_extra, 0) = 0 AND COALESCE(horas_nocturnas, 0) = 0 THEN 1 ELSE 0 END")), "dias_no_laborados"],
      [sequelize.fn("SUM", sequelize.literal("CASE WHEN incapacidad IS NOT NULL THEN 1 ELSE 0 END")), "incapacidades"],
      [sequelize.fn("SUM", sequelize.literal("CASE WHEN permiso IS NOT NULL THEN 1 ELSE 0 END")), "permisos"],
      [sequelize.fn("SUM", sequelize.literal("CASE WHEN vacaciones IS NOT NULL THEN 1 ELSE 0 END")), "vacaciones"],
    ],
    where,
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
    ],
    group: ["id_colaborador", "colaborador.id_colaborador", "colaborador.nombre", "colaborador.primer_apellido", "colaborador.segundo_apellido"],
  });

  const rows = grouped.map((item) => {
    const diasNoLaborados = toNumber(item.get("dias_no_laborados"));
    const incapacidades = toNumber(item.get("incapacidades"));
    const permisos = toNumber(item.get("permisos"));
    const vacaciones = toNumber(item.get("vacaciones"));
    const ausenciasInjustificadas = Math.max(0, diasNoLaborados - incapacidades - permisos - vacaciones);

    return {
      id_colaborador: item.id_colaborador,
      colaborador: formatName(item.colaborador),
      dias_no_laborados: Number(diasNoLaborados.toFixed(2)),
      incapacidades: Number(incapacidades.toFixed(2)),
      permisos: Number(permisos.toFixed(2)),
      ausencias_injustificadas: Number(ausenciasInjustificadas.toFixed(2)),
    };
  });

  return buildSuccessResponse("ausentismo", query, rows, {
    notes: ["Ausencias injustificadas se estiman como días no laborados menos incapacidades, permisos y vacaciones registradas."],
  });
}

async function getRankingHorasExtra(query) {
  const wherePlanilla = {};
  if (query.idPeriodo) wherePlanilla.id_periodo = query.idPeriodo;
  if (query.idColaborador) wherePlanilla.id_colaborador = query.idColaborador;

  const wherePeriodo = {};
  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) wherePeriodo.fecha_fin = dateWhere;

  const grouped = await Planilla.findAll({
    attributes: [
      "id_colaborador",
      [sequelize.fn("SUM", sequelize.col("horas_extra")), "horas_extra"],
    ],
    where: wherePlanilla,
    include: [
      {
        model: PeriodoPlanilla,
        as: "periodo",
        attributes: ["id_periodo", "fecha_fin"],
        required: Object.keys(wherePeriodo).length > 0,
        ...(Object.keys(wherePeriodo).length > 0 ? { where: wherePeriodo } : {}),
      },
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      },
      {
        model: Contrato,
        as: "contrato",
        attributes: ["id_contrato"],
        include: [
          {
            model: Puesto,
            as: "puesto",
            attributes: ["id_puesto", "nombre"],
            include: [
              {
                model: Departamento,
                as: "departamento",
                attributes: ["id_departamento", "nombre"],
                ...(query.idDepartamento
                  ? { where: { id_departamento: query.idDepartamento }, required: true }
                  : {}),
              },
            ],
          },
        ],
      },
    ],
    group: [
      "id_colaborador",
      "colaborador.id_colaborador",
      "colaborador.nombre",
      "colaborador.primer_apellido",
      "colaborador.segundo_apellido",
      "contrato.id_contrato",
      "contrato->puesto.id_puesto",
      "contrato->puesto.nombre",
      "contrato->puesto->departamento.id_departamento",
      "contrato->puesto->departamento.nombre",
    ],
  });

  const colaboradores = grouped
    .map((item) => ({
      tipo: "colaborador",
      nombre: formatName(item.colaborador),
      departamento: item.contrato?.puesto?.departamento?.nombre ?? "N/D",
      horas_extra: Number(toNumber(item.get("horas_extra")).toFixed(2)),
    }))
    .filter((item) => !query.search || item.nombre.toLowerCase().includes(query.search.toLowerCase()))
    .sort((left, right) => right.horas_extra - left.horas_extra)
    .map((item, index) => ({ ...item, ranking: index + 1 }));

  const departamentoMap = new Map();
  colaboradores.forEach((item) => {
    if (!departamentoMap.has(item.departamento)) {
      departamentoMap.set(item.departamento, 0);
    }
    departamentoMap.set(item.departamento, departamentoMap.get(item.departamento) + item.horas_extra);
  });

  const departamentos = Array.from(departamentoMap.entries())
    .map(([nombre, horasExtra]) => ({
      tipo: "departamento",
      nombre,
      departamento: nombre,
      horas_extra: Number(horasExtra.toFixed(2)),
    }))
    .sort((left, right) => right.horas_extra - left.horas_extra)
    .map((item, index) => ({ ...item, ranking: index + 1 }));

  const rows = [...colaboradores, ...departamentos];

  return buildSuccessResponse("ranking_horas_extra", query, rows, {
    summary: {
      total_colaboradores_rankeados: colaboradores.length,
      total_departamentos_rankeados: departamentos.length,
    },
  });
}

async function getSaldoVacacionesColaborador(query) {
  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const saldos = await SaldoVacaciones.findAll({
    where: query.idColaborador ? { id_colaborador: query.idColaborador } : undefined,
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
    ],
  });

  const rows = saldos.map((saldo) => {
    const acumuladas = toNumber(saldo.dias_ganados);
    const disfrutadas = toNumber(saldo.dias_tomados);
    const pendientes = Math.max(0, acumuladas - disfrutadas);

    return {
      id_colaborador: saldo.id_colaborador,
      colaborador: formatName(saldo.colaborador),
      acumuladas: Number(acumuladas.toFixed(2)),
      disfrutadas: Number(disfrutadas.toFixed(2)),
      pendientes: Number(pendientes.toFixed(2)),
      proximas_vencer: pendientes >= 10 ? "Sí" : "No",
    };
  });

  return buildSuccessResponse("saldo_vacaciones_colaborador", query, rows);
}

async function getProvisionVacaciones(query) {
  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const saldos = await SaldoVacaciones.findAll({
    where: query.idColaborador ? { id_colaborador: query.idColaborador } : undefined,
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
    ],
  });

  const contratos = await Contrato.findAll({
    where: {
      id_colaborador: {
        [Op.in]: Array.from(new Set(saldos.map((saldo) => saldo.id_colaborador))),
      },
    },
    attributes: ["id_contrato", "id_colaborador", "salario_base"],
    order: [["id_contrato", "DESC"]],
  });

  const salaryByColaborador = new Map();
  contratos.forEach((contrato) => {
    if (!salaryByColaborador.has(contrato.id_colaborador)) {
      salaryByColaborador.set(contrato.id_colaborador, toNumber(contrato.salario_base));
    }
  });

  const rows = saldos.map((saldo) => {
    const salarioBase = salaryByColaborador.get(saldo.id_colaborador) ?? 0;
    const diasPendientes = Math.max(0, toNumber(saldo.dias_ganados) - toNumber(saldo.dias_tomados));
    const provision = Number((diasPendientes * (salarioBase / 30)).toFixed(2));

    return {
      id_colaborador: saldo.id_colaborador,
      colaborador: formatName(saldo.colaborador),
      salario_base: Number(salarioBase.toFixed(2)),
      dias_pendientes: Number(diasPendientes.toFixed(2)),
      provision,
    };
  });

  return buildSuccessResponse("provision_vacaciones", query, rows, {
    notes: ["La provisión se estima como días pendientes * (salario base / 30)."],
    summary: {
      provision_total: Number(rows.reduce((acc, row) => acc + row.provision, 0).toFixed(2)),
    },
  });
}

async function getContratosActivos(query) {
  const whereContrato = {};
  if (query.idColaborador) whereContrato.id_colaborador = query.idColaborador;

  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) whereContrato.fecha_inicio = dateWhere;

  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const includeEstado = {
    model: Estado,
    as: "estadoRef",
    attributes: ["id_estado", "estado"],
    required: true,
  };

  if (!query.includeInactivos) {
    includeEstado.where = sequelize.where(sequelize.fn("LOWER", sequelize.col("estadoRef.estado")), "activo");
  }

  const contratos = await Contrato.findAll({
    where: whereContrato,
    include: [
      includeEstado,
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
      {
        model: TipoContrato,
        as: "tipoContrato",
        attributes: ["id_tipo_contrato", "tipo_contrato"],
      },
      {
        model: TipoJornada,
        as: "tipoJornada",
        attributes: ["id_tipo_jornada", "tipo"],
      },
      {
        model: Puesto,
        as: "puesto",
        attributes: ["id_puesto", "nombre"],
        include: [
          {
            model: Departamento,
            as: "departamento",
            attributes: ["id_departamento", "nombre"],
            ...(query.idDepartamento
              ? { where: { id_departamento: query.idDepartamento }, required: true }
              : {}),
          },
        ],
      },
    ],
  });

  const rows = contratos.map((contrato) => ({
    id_contrato: contrato.id_contrato,
    colaborador: formatName(contrato.colaborador),
    tipo_contrato: contrato.tipoContrato?.tipo_contrato ?? "N/D",
    jornada: contrato.tipoJornada?.tipo ?? "N/D",
    departamento: contrato.puesto?.departamento?.nombre ?? "N/D",
    fecha_inicio: contrato.fecha_inicio,
    fecha_vencimiento: null,
    estado: contrato.estadoRef?.estado ?? "N/D",
  }));

  return buildSuccessResponse("contratos_activos", query, rows, {
    notes: ["Fecha de vencimiento no está disponible en el modelo actual de contrato."],
  });
}

function firstDayOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function lastDayOfMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function dateOnlyUTC(date) {
  return date.toISOString().slice(0, 10);
}

async function countDotacionAproxAt(date) {
  return Contrato.count({
    distinct: true,
    col: "id_colaborador",
    where: {
      fecha_inicio: {
        [Op.lte]: date,
      },
    },
    include: [
      {
        model: Estado,
        as: "estadoRef",
        attributes: [],
        required: true,
        where: sequelize.where(sequelize.fn("LOWER", sequelize.col("estadoRef.estado")), "activo"),
      },
    ],
  });
}

async function getRotacionPersonal(query) {
  const now = new Date();
  const defaultFrom = `${now.getUTCFullYear()}-01-01`;
  const defaultTo = `${now.getUTCFullYear()}-12-31`;

  const from = new Date(`${query.dateFrom ?? defaultFrom}T00:00:00.000Z`);
  const to = new Date(`${query.dateTo ?? defaultTo}T00:00:00.000Z`);

  const months = [];
  for (let cursor = firstDayOfMonth(from); cursor <= to; cursor = addMonths(cursor, 1)) {
    const monthStart = firstDayOfMonth(cursor);
    const monthEnd = lastDayOfMonth(cursor);

    const boundedStart = monthStart < from ? from : monthStart;
    const boundedEnd = monthEnd > to ? to : monthEnd;

    months.push({
      label: `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, "0")}`,
      start: dateOnlyUTC(boundedStart),
      end: dateOnlyUTC(boundedEnd),
    });
  }

  const rows = [];
  for (const month of months) {
    const [ingresos, salidas, dotacionInicio, dotacionFin] = await Promise.all([
      Contrato.count({
        where: {
          fecha_inicio: {
            [Op.between]: [month.start, month.end],
          },
        },
      }),
      Liquidacion.count({
        where: {
          fecha_terminacion: {
            [Op.between]: [month.start, month.end],
          },
        },
      }),
      countDotacionAproxAt(month.start),
      countDotacionAproxAt(month.end),
    ]);

    const dotacionPromedio = (dotacionInicio + dotacionFin) / 2;
    const tasaRotacion = dotacionPromedio > 0 ? (salidas / dotacionPromedio) * 100 : 0;

    rows.push({
      mes: month.label,
      ingresos,
      salidas,
      dotacion_promedio: Number(dotacionPromedio.toFixed(2)),
      tasa_rotacion: Number(tasaRotacion.toFixed(2)),
    });
  }

  return buildSuccessResponse("rotacion_personal", query, rows, {
    notes: ["La dotación promedio es aproximada y se calcula por contratos activos por estado."],
  });
}

async function getTendenciaIncapacidades(query) {
  const whereJornada = {
    incapacidad: {
      [Op.ne]: null,
    },
  };

  const dateWhere = getDateWhere(query.dateFrom, query.dateTo);
  if (dateWhere) whereJornada.fecha = dateWhere;
  if (query.idColaborador) whereJornada.id_colaborador = query.idColaborador;

  const whereColaborador = {};
  if (query.search) {
    whereColaborador[Op.or] = [
      { nombre: { [Op.like]: `%${query.search}%` } },
      { primer_apellido: { [Op.like]: `%${query.search}%` } },
      { segundo_apellido: { [Op.like]: `%${query.search}%` } },
    ];
  }

  const jornadas = await JornadaDiaria.findAll({
    where: whereJornada,
    attributes: ["id_jornada", "fecha"],
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        required: Object.keys(whereColaborador).length > 0,
        ...(Object.keys(whereColaborador).length > 0 ? { where: whereColaborador } : {}),
      },
      {
        model: Incapacidad,
        as: "incapacidadRef",
        attributes: ["id_incapacidad", "id_tipo_incap"],
        required: true,
        include: [
          {
            model: TipoIncapacidad,
            as: "tipo",
            attributes: ["id_tipo_incap", "tipo_incapacidad"],
          },
        ],
      },
    ],
  });

  const byMonth = new Map();
  jornadas.forEach((jornada) => {
    const month = String(jornada.fecha).slice(0, 7);
    const tipoIncapacidad = jornada.incapacidadRef?.tipo?.tipo_incapacidad ?? "N/D";
    const colaborador = formatName(jornada.colaborador);

    if (!byMonth.has(month)) {
      byMonth.set(month, {
        total: 0,
        byType: new Map(),
        byColaborador: new Map(),
        byTypeColaborador: new Map(),
      });
    }

    const monthEntry = byMonth.get(month);
    monthEntry.total += 1;

    monthEntry.byType.set(tipoIncapacidad, (monthEntry.byType.get(tipoIncapacidad) ?? 0) + 1);
    monthEntry.byColaborador.set(colaborador, (monthEntry.byColaborador.get(colaborador) ?? 0) + 1);

    const mixKey = `${tipoIncapacidad}||${colaborador}`;
    monthEntry.byTypeColaborador.set(mixKey, (monthEntry.byTypeColaborador.get(mixKey) ?? 0) + 1);
  });

  const rows = [];
  Array.from(byMonth.entries())
    .sort(([leftMonth], [rightMonth]) => leftMonth.localeCompare(rightMonth))
    .forEach(([month, monthEntry]) => {
      monthEntry.byTypeColaborador.forEach((days, mixKey) => {
        const [tipoIncapacidad, colaborador] = mixKey.split("||");
        const byType = monthEntry.byType.get(tipoIncapacidad) ?? 0;
        const byColaborador = monthEntry.byColaborador.get(colaborador) ?? 0;

        rows.push({
          mes: month,
          tipo_incapacidad: tipoIncapacidad,
          colaborador,
          dias: days,
          porcentaje_tipo_mes: monthEntry.total > 0 ? Number(((byType / monthEntry.total) * 100).toFixed(2)) : 0,
          porcentaje_colaborador_mes: monthEntry.total > 0 ? Number(((byColaborador / monthEntry.total) * 100).toFixed(2)) : 0,
        });
      });
    });

  return buildSuccessResponse("tendencia_incapacidades", query, rows);
}
