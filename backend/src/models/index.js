import { sequelize } from "../config/db.js";

// ========================================
//  MODELOS
// ========================================
import { Colaborador } from "./colaborador.js";
import { Usuario } from "./usuario.js";
import { Genero } from "./genero.js";
import { EstadoCivil } from "./estado_civil.js";
import { Estado } from "./estado.js";
import { Rol } from "./rol.js";
import { UsuarioRol } from "./usuario_rol.js";
import { BitacoraAuditoria } from "./bitacora_auditoria.js";

// Organización
import { Departamento } from "./departamento.js";
import { Puesto } from "./puesto.js";
import { TipoContrato } from "./tipo_contrato.js";
import { TipoJornada } from "./tipo_jornada.js";
import { CicloPago } from "./ciclo_pago.js";
import { Contrato } from "./contrato.js";
import { HorarioLaboral } from "./horario_laboral.js";
import { AjusteSalarial } from "./ajuste_salarial.js";

// Evaluaciones
import { Evaluacion } from "./evaluacion.js";
import { RubroEvaluacion } from "./rubro_evaluacion.js";
import { EvaluacionRubro } from "./evaluacion_rubro.js";

// Planillas
import { PeriodoPlanilla } from "./periodo_planilla.js";
import { DetallePlanilla } from "./detalle_planilla.js";
import { TipoDeduccion } from "./tipo_deduccion.js";
import { DeduccionPlanilla } from "./deduccion_planilla.js";
import { Aguinaldo } from "./aguinaldo.js";

// Ubicación
import { Provincia } from "./provincia.js";
import { Canton } from "./canton.js";
import { Distrito } from "./distrito.js";
import { Direccion } from "./direccion.js";

// Asistencia / Incapacidades
import { TipoMarca } from "./tipo_marca.js";
import { MarcaAsistencia } from "./marca_asistencia.js";
import { TipoIncapacidad } from "./tipo_incapacidad.js";
import { Incapacidad } from "./incapacidad.js";
import { JornadaDiaria } from "./jornada_diaria.js";

// Solicitudes
import { TipoHoraExtra } from "./tipo_hora_extra.js";
import { SolicitudHoraExtra } from "./solicitud_hora_extra.js";
import { TipoSolicitud } from "./tipo_solicitud.js";
import { SolicitudPermisosLicencias } from "./solicitud_permisos_licencias.js";
import { SaldoVacaciones } from "./saldo_vacaciones.js";
import { SolicitudVacaciones } from "./solicitud_vacaciones.js";

// Liquidaciones
import { Liquidacion } from "./liquidacion.js";
import { CausaLiquidacion } from "./causa_liquidacion.js";

// Otros
import { Telefono } from "./telefono.js";

// ========================================
//  RELACIONES
// ========================================

// ---------- CATÁLOGOS ----------
Genero.hasMany(Colaborador, { foreignKey: "id_genero" });
Colaborador.belongsTo(Genero, { foreignKey: "id_genero" });

EstadoCivil.hasMany(Colaborador, { foreignKey: "estado_civil" });
Colaborador.belongsTo(EstadoCivil, { foreignKey: "estado_civil" });

Estado.hasMany(Colaborador, { foreignKey: "estado" });
Colaborador.belongsTo(Estado, { foreignKey: "estado" });

Estado.hasMany(Usuario, { foreignKey: "estado" });
Usuario.belongsTo(Estado, { foreignKey: "estado" });

Estado.hasMany(Puesto, { foreignKey: "estado" });
Puesto.belongsTo(Estado, { foreignKey: "estado" });

Estado.hasMany(Contrato, { foreignKey: "estado" });
Contrato.belongsTo(Estado, { foreignKey: "estado" });

Estado.hasMany(PeriodoPlanilla, { foreignKey: "estado" });
PeriodoPlanilla.belongsTo(Estado, { foreignKey: "estado" });

Estado.hasMany(SolicitudHoraExtra, { foreignKey: "estado" });
SolicitudHoraExtra.belongsTo(Estado, { foreignKey: "estado" });

Estado.hasMany(SolicitudVacaciones, { foreignKey: "estado_solicitud" });
SolicitudVacaciones.belongsTo(Estado, { foreignKey: "estado_solicitud" });

Estado.hasMany(SolicitudPermisosLicencias, { foreignKey: "estado_solicitud" });
SolicitudPermisosLicencias.belongsTo(Estado, { foreignKey: "estado_solicitud" });

// ---------- ORGANIZACIÓN ----------
Departamento.hasMany(Puesto, { foreignKey: "id_departamento" });
Puesto.belongsTo(Departamento, { foreignKey: "id_departamento" });

Puesto.hasMany(Contrato, { foreignKey: "id_puesto" });
Contrato.belongsTo(Puesto, { foreignKey: "id_puesto" });

TipoContrato.hasMany(Contrato, { foreignKey: "id_tipo_contrato" });
Contrato.belongsTo(TipoContrato, { foreignKey: "id_tipo_contrato" });

TipoJornada.hasMany(Contrato, { foreignKey: "id_tipo_jornada" });
Contrato.belongsTo(TipoJornada, { foreignKey: "id_tipo_jornada" });

CicloPago.hasMany(Contrato, { foreignKey: "id_ciclo_pago" });
Contrato.belongsTo(CicloPago, { foreignKey: "id_ciclo_pago" });

Contrato.hasMany(HorarioLaboral, { foreignKey: "id_contrato" });
HorarioLaboral.belongsTo(Contrato, { foreignKey: "id_contrato" });

Contrato.hasMany(AjusteSalarial, { foreignKey: "id_contrato" });
AjusteSalarial.belongsTo(Contrato, { foreignKey: "id_contrato" });

// ---------- PLANILLAS ----------
CicloPago.hasMany(PeriodoPlanilla, { foreignKey: "id_ciclo_pago" });
PeriodoPlanilla.belongsTo(CicloPago, { foreignKey: "id_ciclo_pago" });

PeriodoPlanilla.hasMany(DetallePlanilla, { foreignKey: "id_periodo" });
DetallePlanilla.belongsTo(PeriodoPlanilla, { foreignKey: "id_periodo" });

Contrato.hasMany(DetallePlanilla, { foreignKey: "id_contrato" });
DetallePlanilla.belongsTo(Contrato, { foreignKey: "id_contrato" });

Colaborador.hasMany(DetallePlanilla, { foreignKey: "id_colaborador" });
DetallePlanilla.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

DetallePlanilla.hasMany(DeduccionPlanilla, { foreignKey: "id_detalle" });
DeduccionPlanilla.belongsTo(DetallePlanilla, { foreignKey: "id_detalle" });

TipoDeduccion.hasMany(DeduccionPlanilla, { foreignKey: "id_tipo_deduccion" });
DeduccionPlanilla.belongsTo(TipoDeduccion, { foreignKey: "id_tipo_deduccion" });

// ---------- AGUINALDO ----------
Colaborador.hasMany(Aguinaldo, { foreignKey: "id_colaborador" });
Aguinaldo.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Aguinaldo, {
  foreignKey: "registrado_por",
  as: "aguinaldos_registrados",
});
Aguinaldo.belongsTo(Colaborador, {
  foreignKey: "registrado_por",
  as: "registrador",
});

// ---------- EVALUACIONES ----------
Colaborador.hasMany(Evaluacion, { foreignKey: "id_colaborador" });
Evaluacion.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Evaluacion, {
  foreignKey: "id_evaluador",
  as: "evaluaciones_realizadas",
});
Evaluacion.belongsTo(Colaborador, {
  foreignKey: "id_evaluador",
  as: "evaluador",
});

Evaluacion.belongsToMany(RubroEvaluacion, {
  through: EvaluacionRubro,
  foreignKey: "id_evaluacion",
  otherKey: "id_rubro_evaluacion",
});
RubroEvaluacion.belongsToMany(Evaluacion, {
  through: EvaluacionRubro,
  foreignKey: "id_rubro_evaluacion",
  otherKey: "id_evaluacion",
});

// ---------- ASISTENCIA / INCAPACIDADES ----------
TipoMarca.hasMany(MarcaAsistencia, { foreignKey: "id_tipo_marca" });
MarcaAsistencia.belongsTo(TipoMarca, { foreignKey: "id_tipo_marca" });

Colaborador.hasMany(MarcaAsistencia, { foreignKey: "id_colaborador" });
MarcaAsistencia.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

TipoIncapacidad.hasMany(Incapacidad, { foreignKey: "id_tipo_incap" });
Incapacidad.belongsTo(TipoIncapacidad, { foreignKey: "id_tipo_incap" });

Colaborador.hasMany(Incapacidad, { foreignKey: "id_colaborador" });
Incapacidad.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(JornadaDiaria, { foreignKey: "id_colaborador" });
JornadaDiaria.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

// ---------- SOLICITUDES ----------
TipoHoraExtra.hasMany(SolicitudHoraExtra, { foreignKey: "id_tipo_hx" });
SolicitudHoraExtra.belongsTo(TipoHoraExtra, { foreignKey: "id_tipo_hx" });

Colaborador.hasMany(SolicitudHoraExtra, { foreignKey: "id_colaborador" });
SolicitudHoraExtra.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(SolicitudHoraExtra, {
  foreignKey: "aprobado_por",
  as: "hx_aprobadas",
});
SolicitudHoraExtra.belongsTo(Colaborador, {
  foreignKey: "aprobado_por",
  as: "aprobador",
});

TipoSolicitud.hasMany(SolicitudPermisosLicencias, { foreignKey: "tipo_solicitud" });
SolicitudPermisosLicencias.belongsTo(TipoSolicitud, { foreignKey: "tipo_solicitud" });

Colaborador.hasMany(SolicitudVacaciones, { foreignKey: "id_colaborador" });
SolicitudVacaciones.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

SaldoVacaciones.hasMany(SolicitudVacaciones, { foreignKey: "id_saldo_vacaciones" });
SolicitudVacaciones.belongsTo(SaldoVacaciones, { foreignKey: "id_saldo_vacaciones" });

// ---------- LIQUIDACIONES ----------
Colaborador.hasMany(Liquidacion, { foreignKey: "id_colaborador" });
Liquidacion.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Liquidacion, {
  foreignKey: "id_aprobador",
  as: "liquidaciones_aprobadas",
});
Liquidacion.belongsTo(Colaborador, {
  foreignKey: "id_aprobador",
  as: "aprobador",
});

CausaLiquidacion.hasMany(Liquidacion, { foreignKey: "causa" });
Liquidacion.belongsTo(CausaLiquidacion, { foreignKey: "causa" });

SaldoVacaciones.hasMany(Liquidacion, { foreignKey: "saldo_vacaciones" });
Liquidacion.belongsTo(SaldoVacaciones, { foreignKey: "saldo_vacaciones" });

// ---------- USUARIOS ----------
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: "id_usuario" });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: "id_rol" });

Colaborador.hasMany(Usuario, { foreignKey: "id_colaborador" });
Usuario.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Usuario.hasMany(BitacoraAuditoria, { foreignKey: "actor_id" });
BitacoraAuditoria.belongsTo(Usuario, { foreignKey: "actor_id" });

// ---------- TELÉFONO (requisito académico) ----------
Colaborador.hasMany(Telefono, { foreignKey: "id_colaborador" });
Telefono.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

// ========================================
//  EXPORTS
// ========================================
export {
  sequelize,
  Colaborador,
  Usuario,
  Genero,
  EstadoCivil,
  Estado,
  Rol,
  UsuarioRol,
  BitacoraAuditoria,

  // Organización
  Departamento,
  Puesto,
  TipoContrato,
  TipoJornada,
  CicloPago,
  Contrato,
  HorarioLaboral,
  AjusteSalarial,

  // Evaluaciones
  Evaluacion,
  RubroEvaluacion,
  EvaluacionRubro,

  // Planillas
  PeriodoPlanilla,
  DetallePlanilla,
  TipoDeduccion,
  DeduccionPlanilla,
  Aguinaldo,

  // Ubicación
  Provincia,
  Canton,
  Distrito,
  Direccion,

  // Asistencia y solicitudes
  TipoMarca,
  MarcaAsistencia,
  TipoIncapacidad,
  Incapacidad,
  JornadaDiaria,
  TipoHoraExtra,
  SolicitudHoraExtra,
  TipoSolicitud,
  SolicitudPermisosLicencias,
  SolicitudVacaciones,
  SaldoVacaciones,

  // Liquidaciones
  Liquidacion,
  CausaLiquidacion,

  // Otros
  Telefono,
};
