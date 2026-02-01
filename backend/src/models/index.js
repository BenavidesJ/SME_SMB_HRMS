// src/models/index.js
import { sequelize } from "../config/db.js";

import { Aguinaldo } from "./definitions/aguinaldo.js";
import { BitacoraAuditoria } from "./definitions/bitacora_auditoria.js";
import { Canton } from "./definitions/canton.js";
import { CausaLiquidacion } from "./definitions/causa_liquidacion.js";
import { CicloPago } from "./definitions/ciclo_pago.js";
import { Colaborador } from "./definitions/colaborador.js";
import { Contrato } from "./definitions/contrato.js";
import { Deduccion } from "./definitions/deduccion.js";
import { DeduccionPlanilla } from "./definitions/deduccion_planilla.js";
import { Departamento } from "./definitions/departamento.js";
import { Direccion } from "./definitions/direccion.js";
import { Distrito } from "./definitions/distrito.js";
import { Estado } from "./definitions/estado.js";
import { EstadoCivil } from "./definitions/estadoCivil.js";
import { Evaluacion } from "./definitions/evaluacion.js";
import { EvaluacionRubro } from "./definitions/evaluacion_rubro.js";
import { Feriado } from "./definitions/feriado.js";
import { HorarioLaboral } from "./definitions/horario_laboral.js";
import { Incapacidad } from "./definitions/incapacidad.js";
import { JornadaDiaria } from "./definitions/jornada_diaria.js";
import { Liquidacion } from "./definitions/Liquidacion.js";
import { MarcaAsistencia } from "./definitions/marcaAsistencia.js";
import { PeriodoPlanilla } from "./definitions/periodoPlanilla.js";
import { Planilla } from "./definitions/planilla.js";
import { Provincia } from "./definitions/provincia.js";
import { Puesto } from "./definitions/puesto.js";
import { Rol } from "./definitions/rol.js";
import { RubroEvaluacion } from "./definitions/rubro_evaluacion.js";
import { SaldoVacaciones } from "./definitions/saldo_vacaciones.js";
import { SolicitudHoraExtra } from "./definitions/solicitud_hora_extra.js";
import { SolicitudPermisos } from "./definitions/solicitud_permisos.js";
import { SolicitudVacaciones } from "./definitions/solicitud_vacaciones.js";
import { TipoContrato } from "./definitions/tipo_contrato.js";
import { TipoHoraExtra } from "./definitions/tipo_hora_extra.js";
import { TipoIncapacidad } from "./definitions/tipo_incapacidad.js";
import { TipoJornada } from "./definitions/tipo_jornada.js";
import { TipoMarca } from "./definitions/tipo_marca.js";
import { Usuario } from "./definitions/usuario.js";

// init
export const models = {};
models.Estado = Estado(sequelize);
models.EstadoCivil = EstadoCivil(sequelize);
models.Provincia = Provincia(sequelize);
models.Canton = Canton(sequelize);
models.Distrito = Distrito(sequelize);
models.Direccion = Direccion(sequelize);

models.Colaborador = Colaborador(sequelize);
models.Usuario = Usuario(sequelize);
models.BitacoraAuditoria = BitacoraAuditoria(sequelize);
models.Rol = Rol(sequelize);

models.Departamento = Departamento(sequelize);
models.Puesto = Puesto(sequelize);
models.TipoContrato = TipoContrato(sequelize);
models.TipoJornada = TipoJornada(sequelize);
models.Contrato = Contrato(sequelize);
models.HorarioLaboral = HorarioLaboral(sequelize);

models.TipoIncapacidad = TipoIncapacidad(sequelize);
models.Incapacidad = Incapacidad(sequelize);
models.Feriado = Feriado(sequelize);
models.JornadaDiaria = JornadaDiaria(sequelize);

models.Aguinaldo = Aguinaldo(sequelize);
models.CausaLiquidacion = CausaLiquidacion(sequelize);
models.Liquidacion = Liquidacion(sequelize);
models.SaldoVacaciones = SaldoVacaciones(sequelize);

models.Evaluacion = Evaluacion(sequelize);
models.RubroEvaluacion = RubroEvaluacion(sequelize);
models.EvaluacionRubro = EvaluacionRubro(sequelize);

models.MarcaAsistencia = MarcaAsistencia(sequelize);
models.TipoMarca = TipoMarca(sequelize);

models.CicloPago = CicloPago(sequelize);
models.PeriodoPlanilla = PeriodoPlanilla(sequelize);
models.Planilla = Planilla(sequelize);
models.Deduccion = Deduccion(sequelize);
models.DeduccionPlanilla = DeduccionPlanilla(sequelize);

models.SolicitudVacaciones = SolicitudVacaciones(sequelize);
models.SolicitudPermisos = SolicitudPermisos(sequelize);
models.TipoHoraExtra = TipoHoraExtra(sequelize);
models.SolicitudHoraExtra = SolicitudHoraExtra(sequelize);

/**
 * Associations
 */

// Estados y catálogos
models.Colaborador.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.Colaborador, { foreignKey: "estado", as: "colaboradores" });

models.Contrato.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.Contrato, { foreignKey: "estado", as: "contratos" });

models.HorarioLaboral.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.HorarioLaboral, { foreignKey: "estado", as: "horariosLaborales" });

models.PeriodoPlanilla.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.PeriodoPlanilla, { foreignKey: "estado", as: "periodosPlanilla" });

models.Puesto.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.Puesto, { foreignKey: "estado", as: "puestos" });

models.SolicitudPermisos.belongsTo(models.Estado, { foreignKey: "estado_solicitud", as: "estadoSolicitud" });
models.Estado.hasMany(models.SolicitudPermisos, { foreignKey: "estado_solicitud", as: "solicitudesPermiso" });

models.SolicitudVacaciones.belongsTo(models.Estado, { foreignKey: "estado_solicitud", as: "estadoSolicitud" });
models.Estado.hasMany(models.SolicitudVacaciones, { foreignKey: "estado_solicitud", as: "solicitudesVacaciones" });

models.SolicitudHoraExtra.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.SolicitudHoraExtra, { foreignKey: "estado", as: "solicitudesHoraExtra" });

models.Usuario.belongsTo(models.Estado, { foreignKey: "estado", as: "estadoRef" });
models.Estado.hasMany(models.Usuario, { foreignKey: "estado", as: "usuarios" });

// Estado civil
models.Colaborador.belongsTo(models.EstadoCivil, { foreignKey: "estado_civil", as: "estadoCivilRef" });
models.EstadoCivil.hasMany(models.Colaborador, { foreignKey: "estado_civil", as: "colaboradores" });

// Geografía
models.Canton.belongsTo(models.Provincia, { foreignKey: "id_provincia", as: "provincia" });
models.Provincia.hasMany(models.Canton, { foreignKey: "id_provincia", as: "cantones" });

models.Distrito.belongsTo(models.Canton, { foreignKey: "id_canton", as: "canton" });
models.Canton.hasMany(models.Distrito, { foreignKey: "id_canton", as: "distritos" });

models.Direccion.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.Direccion, { foreignKey: "id_colaborador", as: "direcciones" });

models.Direccion.belongsTo(models.Provincia, { foreignKey: "id_provincia", as: "provincia" });
models.Provincia.hasMany(models.Direccion, { foreignKey: "id_provincia", as: "direcciones" });

models.Direccion.belongsTo(models.Canton, { foreignKey: "id_canton", as: "canton" });
models.Canton.hasMany(models.Direccion, { foreignKey: "id_canton", as: "direcciones" });

models.Direccion.belongsTo(models.Distrito, { foreignKey: "id_distrito", as: "distrito" });
models.Distrito.hasMany(models.Direccion, { foreignKey: "id_distrito", as: "direcciones" });

// Organización
models.Departamento.hasMany(models.Puesto, { foreignKey: "id_departamento", as: "puestos" });
models.Puesto.belongsTo(models.Departamento, { foreignKey: "id_departamento", as: "departamento" });

models.Colaborador.hasMany(models.Contrato, { foreignKey: "id_colaborador", as: "contratos" });
models.Contrato.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

models.Contrato.belongsTo(models.Puesto, { foreignKey: "id_puesto", as: "puesto" });
models.Puesto.hasMany(models.Contrato, { foreignKey: "id_puesto", as: "contratos" });

models.Contrato.belongsTo(models.TipoContrato, { foreignKey: "id_tipo_contrato", as: "tipoContrato" });
models.TipoContrato.hasMany(models.Contrato, { foreignKey: "id_tipo_contrato", as: "contratos" });

models.Contrato.belongsTo(models.TipoJornada, { foreignKey: "id_tipo_jornada", as: "tipoJornada" });
models.TipoJornada.hasMany(models.Contrato, { foreignKey: "id_tipo_jornada", as: "contratos" });

models.HorarioLaboral.belongsTo(models.Contrato, { foreignKey: "id_contrato", as: "contrato" });
models.Contrato.hasMany(models.HorarioLaboral, { foreignKey: "id_contrato", as: "horarios" });

models.HorarioLaboral.belongsTo(models.TipoJornada, { foreignKey: "id_tipo_jornada", as: "tipoJornada" });
models.TipoJornada.hasMany(models.HorarioLaboral, { foreignKey: "id_tipo_jornada", as: "horarios" });

// Usuarios y seguridad
models.Usuario.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.Usuario, { foreignKey: "id_colaborador", as: "usuarios" });

models.BitacoraAuditoria.belongsTo(models.Usuario, { foreignKey: "actor_id", as: "actor" });
models.Usuario.hasMany(models.BitacoraAuditoria, { foreignKey: "actor_id", as: "bitacoras" });

models.Rol.belongsTo(models.Usuario, { foreignKey: "id_usuario", as: "usuario" });
models.Usuario.hasMany(models.Rol, { foreignKey: "id_usuario", as: "roles" });

// Aguinaldos
models.Aguinaldo.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Aguinaldo.belongsTo(models.Colaborador, { foreignKey: "registrado_por", as: "registradoPor" });
models.Colaborador.hasMany(models.Aguinaldo, { foreignKey: "id_colaborador", as: "aguinaldos" });
models.Colaborador.hasMany(models.Aguinaldo, { foreignKey: "registrado_por", as: "aguinaldosRegistrados" });

// Vacaciones y liquidaciones
models.SaldoVacaciones.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasOne(models.SaldoVacaciones, { foreignKey: "id_colaborador", as: "saldoVacaciones" });

models.Liquidacion.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.Liquidacion, { foreignKey: "id_colaborador", as: "liquidaciones" });

models.Liquidacion.belongsTo(models.Colaborador, { foreignKey: "id_aprobador", as: "aprobador" });
models.Colaborador.hasMany(models.Liquidacion, { foreignKey: "id_aprobador", as: "liquidacionesAprobadas" });

models.Liquidacion.belongsTo(models.CausaLiquidacion, { foreignKey: "causa", as: "causaRef" });
models.CausaLiquidacion.hasMany(models.Liquidacion, { foreignKey: "causa", as: "liquidaciones" });

models.Liquidacion.belongsTo(models.SaldoVacaciones, { foreignKey: "saldo_vacaciones", as: "saldoVacaciones" });
models.SaldoVacaciones.hasMany(models.Liquidacion, { foreignKey: "saldo_vacaciones", as: "liquidaciones" });

models.SolicitudVacaciones.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.SolicitudVacaciones, { foreignKey: "id_colaborador", as: "solicitudesVacaciones" });

models.SolicitudVacaciones.belongsTo(models.Colaborador, { foreignKey: "id_aprobador", as: "aprobador" });
models.Colaborador.hasMany(models.SolicitudVacaciones, { foreignKey: "id_aprobador", as: "vacacionesAprobadas" });

models.SolicitudVacaciones.belongsTo(models.SaldoVacaciones, { foreignKey: "id_saldo_vacaciones", as: "saldoVacaciones" });
models.SaldoVacaciones.hasMany(models.SolicitudVacaciones, { foreignKey: "id_saldo_vacaciones", as: "solicitudes" });

models.SolicitudPermisos.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.SolicitudPermisos, { foreignKey: "id_colaborador", as: "solicitudesPermisos" });

models.SolicitudPermisos.belongsTo(models.Colaborador, { foreignKey: "id_aprobador", as: "aprobador" });
models.Colaborador.hasMany(models.SolicitudPermisos, { foreignKey: "id_aprobador", as: "permisosAprobados" });

// Jornadas y asistencia
models.JornadaDiaria.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.JornadaDiaria, { foreignKey: "id_colaborador", as: "jornadasDiarias" });

models.JornadaDiaria.belongsTo(models.Feriado, { foreignKey: "feriado", as: "feriadoRef" });
models.Feriado.hasMany(models.JornadaDiaria, { foreignKey: "feriado", as: "jornadas" });

models.JornadaDiaria.belongsTo(models.Incapacidad, { foreignKey: "incapacidad", as: "incapacidadRef" });
models.Incapacidad.hasMany(models.JornadaDiaria, { foreignKey: "incapacidad", as: "jornadas" });

models.JornadaDiaria.belongsTo(models.SolicitudVacaciones, { foreignKey: "vacaciones", as: "vacacionesRef" });
models.SolicitudVacaciones.hasMany(models.JornadaDiaria, { foreignKey: "vacaciones", as: "jornadas" });

models.JornadaDiaria.belongsTo(models.SolicitudPermisos, { foreignKey: "permiso", as: "permisoRef" });
models.SolicitudPermisos.hasMany(models.JornadaDiaria, { foreignKey: "permiso", as: "jornadas" });

models.SolicitudHoraExtra.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.SolicitudHoraExtra, { foreignKey: "id_colaborador", as: "solicitudesHoraExtra" });

models.SolicitudHoraExtra.belongsTo(models.TipoHoraExtra, { foreignKey: "id_tipo_hx", as: "tipoHoraExtra" });
models.TipoHoraExtra.hasMany(models.SolicitudHoraExtra, { foreignKey: "id_tipo_hx", as: "solicitudes" });

models.MarcaAsistencia.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.MarcaAsistencia, { foreignKey: "id_colaborador", as: "marcasAsistencia" });

models.MarcaAsistencia.belongsTo(models.TipoMarca, { foreignKey: "id_tipo_marca", as: "tipoMarca" });
models.TipoMarca.hasMany(models.MarcaAsistencia, { foreignKey: "id_tipo_marca", as: "marcas" });

// Incapacidades
models.Incapacidad.belongsTo(models.TipoIncapacidad, { foreignKey: "id_tipo_incap", as: "tipo" });
models.TipoIncapacidad.hasMany(models.Incapacidad, { foreignKey: "id_tipo_incap", as: "incapacidades" });

// Evaluaciones
models.Evaluacion.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.Evaluacion, { foreignKey: "id_colaborador", as: "evaluacionesRecibidas" });

models.Evaluacion.belongsTo(models.Colaborador, { foreignKey: "id_evaluador", as: "evaluador" });
models.Colaborador.hasMany(models.Evaluacion, { foreignKey: "id_evaluador", as: "evaluacionesRealizadas" });

models.EvaluacionRubro.belongsTo(models.Evaluacion, { foreignKey: "id_evaluacion", as: "evaluacion" });
models.Evaluacion.hasMany(models.EvaluacionRubro, { foreignKey: "id_evaluacion", as: "rubros" });

models.EvaluacionRubro.belongsTo(models.RubroEvaluacion, { foreignKey: "id_rubro_evaluacion", as: "rubro" });
models.RubroEvaluacion.hasMany(models.EvaluacionRubro, { foreignKey: "id_rubro_evaluacion", as: "evaluaciones" });

// Planillas
models.CicloPago.hasMany(models.PeriodoPlanilla, { foreignKey: "ciclo_pago", as: "periodos" });
models.PeriodoPlanilla.belongsTo(models.CicloPago, { foreignKey: "ciclo_pago", as: "cicloPago" });

models.PeriodoPlanilla.hasMany(models.Planilla, { foreignKey: "id_periodo", as: "detalles" });
models.Planilla.belongsTo(models.PeriodoPlanilla, { foreignKey: "id_periodo", as: "periodo" });

models.Planilla.belongsTo(models.Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });
models.Colaborador.hasMany(models.Planilla, { foreignKey: "id_colaborador", as: "planillas" });

models.Planilla.belongsTo(models.Contrato, { foreignKey: "id_contrato", as: "contrato" });
models.Contrato.hasMany(models.Planilla, { foreignKey: "id_contrato", as: "planillas" });

models.Planilla.hasMany(models.DeduccionPlanilla, { foreignKey: "id_planilla", as: "deduccionesDetalle" });
models.DeduccionPlanilla.belongsTo(models.Planilla, { foreignKey: "id_planilla", as: "planilla" });

models.Deduccion.hasMany(models.DeduccionPlanilla, { foreignKey: "id_deduccion", as: "detallesPlanilla" });
models.DeduccionPlanilla.belongsTo(models.Deduccion, { foreignKey: "id_deduccion", as: "deduccion" });

export { sequelize };
