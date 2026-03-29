import { Aguinaldo, Colaborador } from "../../../models/index.js";
import { calcularMontoPorColaborador } from "../utils/aguinaldoCalculator.js";

/**
 * Devuelve el detalle de un registro de aguinaldo, incluyendo su desglose
 * mensual bruto recalculado en tiempo real desde planillas del periodo guardado.
 *
 * @param {{ id_aguinaldo: number }} params
 */
export async function obtenerDetalleAguinaldo({ id_aguinaldo }) {
  const id = Number(id_aguinaldo);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Debe proporcionar un id_aguinaldo valido.");
  }

  const registro = await Aguinaldo.findByPk(id, {
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "identificacion",
        ],
      },
      {
        model: Colaborador,
        as: "registradoPor",
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
        ],
      },
    ],
  });

  if (!registro) {
    throw new Error(`No se encontro un aguinaldo con id ${id}.`);
  }

  const calculo = await calcularMontoPorColaborador(
    registro.id_colaborador,
    registro.periodo_desde,
    registro.periodo_hasta,
  );

  const colaborador = registro.colaborador;
  const registradoPor = registro.registradoPor;

  return {
    id_aguinaldo: registro.id_aguinaldo,
    id_colaborador: registro.id_colaborador,
    nombre_completo: colaborador
      ? [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
          .filter(Boolean)
          .join(" ")
      : `Colaborador #${registro.id_colaborador}`,
    identificacion: colaborador?.identificacion ?? null,
    anio: registro.anio,
    periodo_desde: registro.periodo_desde,
    periodo_hasta: registro.periodo_hasta,
    fecha_pago: registro.fecha_pago,
    monto_registrado: Number(registro.monto_calculado),
    monto_calculado_actual: calculo.montoAguinaldo,
    total_bruto_periodo: calculo.totalBruto,
    desglose_mensual_bruto: calculo.desglose,
    registrado_por: registradoPor
      ? {
        id_colaborador: registradoPor.id_colaborador,
        nombre_completo: [
          registradoPor.nombre,
          registradoPor.primer_apellido,
          registradoPor.segundo_apellido,
        ]
          .filter(Boolean)
          .join(" "),
      }
      : null,
    empresa: {
      nombre: "BioAlquimia",
    },
    generado_en: new Date().toISOString(),
  };
}
