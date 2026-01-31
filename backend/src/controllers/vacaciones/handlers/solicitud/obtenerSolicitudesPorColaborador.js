import { Op } from "sequelize";

import {
  Colaborador,
  Estado,
  SaldoVacaciones,
  SolicitudVacaciones,
} from "../../../../models/index.js";
import { getVacacionesByColaborador } from "../../../../services/scheduleEngine/providers/sequelizeVacationProvider.js";

const toPlain = (row) => {
  if (!row) return null;
  return typeof row.get === "function" ? row.get({ plain: true }) : { ...row };
};

const buildMap = (rows, keyField) =>
  new Map(rows.map((row) => [Number(row[keyField]), row]));

const toColaboradorResumen = (row) => {
  if (!row) return null;
  const plain = toPlain(row);
  return {
    id_colaborador: Number(plain.id_colaborador),
    nombre: plain.nombre ?? null,
    primer_apellido: plain.primer_apellido ?? null,
    segundo_apellido: plain.segundo_apellido ?? null,
    correo_electronico: plain.correo_electronico ?? null,
  };
};

export async function curarSolicitudesVacaciones({
  solicitudes = [],
  transaction,
}) {
  const plainRows = solicitudes.map(toPlain).filter(Boolean);
  if (!plainRows.length) return [];

  const colaboradorIds = [
    ...new Set(
      plainRows
        .flatMap((row) => [row.id_colaborador, row.id_aprobador])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
    ),
  ];

  const estadoIds = [
    ...new Set(
      plainRows
        .map((row) => Number(row.estado_solicitud))
        .filter((value) => Number.isFinite(value))
    ),
  ];

  const saldoIds = [
    ...new Set(
      plainRows
        .map((row) => Number(row.id_saldo_vacaciones))
        .filter((value) => Number.isFinite(value))
    ),
  ];

  const [colaboradores, estados, saldos] = await Promise.all([
    colaboradorIds.length
      ? Colaborador.findAll({
          where: { id_colaborador: { [Op.in]: colaboradorIds } },
          transaction,
        })
      : [],
    estadoIds.length
      ? Estado.findAll({
          where: { id_estado: { [Op.in]: estadoIds } },
          transaction,
        })
      : [],
    saldoIds.length
      ? SaldoVacaciones.findAll({
          where: { id_saldo_vac: { [Op.in]: saldoIds } },
          transaction,
        })
      : [],
  ]);

  const colaboradoresMap = new Map(
    colaboradores.map((row) => {
      const resumen = toColaboradorResumen(row);
      return [resumen.id_colaborador, resumen];
    })
  );
  const estadosMap = buildMap(
    estados.map((row) => row.get({ plain: true })),
    "id_estado"
  );
  const saldosMap = buildMap(
    saldos.map((row) => row.get({ plain: true })),
    "id_saldo_vac"
  );

  return plainRows.map((row) => {
    const colaborador = colaboradoresMap.get(Number(row.id_colaborador)) ?? null;
    const aprobador = colaboradoresMap.get(Number(row.id_aprobador)) ?? null;
    const estado = estadosMap.get(Number(row.estado_solicitud)) ?? null;
    const saldo = saldosMap.get(Number(row.id_saldo_vacaciones)) ?? null;

    return {
      id_solicitud_vacaciones: Number(row.id_solicitud_vacaciones),
      colaborador,
      aprobador,
      estado_solicitud: estado?.estado ?? null,
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      saldo_vacaciones: saldo
        ? {
            dias_ganados: Number(saldo.dias_ganados),
            dias_tomados: Number(saldo.dias_tomados),
          }
        : null,
    };
  });
}

export const obtenerSolicitudes = async ({
  id_colaborador,
  limit = 50,
  offset = 0,
  transaction,
}) => {
  if (!Number.isFinite(Number(id_colaborador))) {
    throw new Error("obtenerSolicitudes: id_colaborador inválido");
  }

  const rows = await getVacacionesByColaborador({
    models: { SolicitudVacaciones },
    idColaborador: Number(id_colaborador),
    limit: Number(limit),
    offset: Number(offset),
    transaction,
  });

  return curarSolicitudesVacaciones({ solicitudes: rows, transaction });
};