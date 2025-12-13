import { sequelize } from "../config/db.js";

// ========================================
//  Modelos
// ========================================
import { Colaborador } from "./colaborador.js";
import { Usuario } from "./usuario.js";
import { Genero } from "./genero.js";
import { Rol } from "./rol.js";
import { UsuarioRol } from "./usuario_rol.js";
import { BitacoraAuditoria } from "./bitacora_auditoria.js";

// Organización
import { Departamento } from "./departamento.js";
import { Puesto } from "./puesto.js";
import { TipoContrato } from "./tipo_contrato.js";
import { Contrato } from "./contrato.js";
import { TipoJornada } from "./tipo_jornada.js";
import { HorarioLaboral } from "./horario_laboral.js";
import { AjusteSalarial } from "./ajuste_salarial.js";

// Evaluaciones
import { RubroEvaluacion } from "./rubro_evaluacion.js";
import { Evaluacion } from "./evaluacion.js";
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

// Solicitudes y Ausencias
import { TipoMarca } from "./tipo_marca.js";
import { MarcaAsistencia } from "./marca_asistencia.js";
import { TipoIncapacidad } from "./tipo_incapacidad.js";
import { Incapacidad } from "./incapacidad.js";
import { JornadaDiaria } from "./jornada_diaria.js";
import { SolicitudVacaciones } from "./solicitud_vacaciones.js";
import { SolicitudHoraExtra } from "./solicitud_hora_extra.js";
import { TipoHoraExtra } from "./tipo_hora_extra.js";
import { SolicitudPermisosLicencias } from "./solicitud_permisos_licencias.js";
import { SaldoVacaciones } from "./saldo_vacaciones.js";

// Liquidaciones
import { Liquidacion } from "./liquidacion.js";

// Otros
import { Telefono } from "./telefono.js";
import { Estado } from "./estado.js";


// ========================================
//  RELACIONES ENTRE MODELOS
// ========================================

// -----------------------------
//  COLABORADOR
// -----------------------------
Colaborador.hasMany(Contrato, { foreignKey: "id_colaborador" });
Contrato.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Usuario, { foreignKey: "id_colaborador" });
Usuario.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Evaluacion, { foreignKey: "id_colaborador", as: "evaluaciones" });
Evaluacion.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(Evaluacion, { foreignKey: "id_evaluador", as: "evaluaciones_realizadas" });
Evaluacion.belongsTo(Colaborador, { foreignKey: "id_evaluador", as: "evaluador" });

Colaborador.hasMany(Liquidacion, { foreignKey: "id_colaborador" });
Liquidacion.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Liquidacion, { foreignKey: "aprobado_por", as: "liquidaciones_aprobadas" });
Liquidacion.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(DetallePlanilla, { foreignKey: "id_colaborador" });
DetallePlanilla.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(DetallePlanilla, { foreignKey: "registrado_por", as: "planillas_registradas" });
DetallePlanilla.belongsTo(Colaborador, { foreignKey: "registrado_por", as: "registrador" });

Colaborador.hasMany(Incapacidad, { foreignKey: "id_colaborador" });
Incapacidad.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(JornadaDiaria, { foreignKey: "id_colaborador" });
JornadaDiaria.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(MarcaAsistencia, { foreignKey: "id_colaborador" });
MarcaAsistencia.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Aguinaldo, { foreignKey: "id_colaborador" });
Aguinaldo.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Aguinaldo, { foreignKey: "aprobado_por", as: "aguinaldos_aprobados" });
Aguinaldo.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(SaldoVacaciones, { foreignKey: "id_colaborador" });
SaldoVacaciones.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(SolicitudHoraExtra, { foreignKey: "id_colaborador" });
SolicitudHoraExtra.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(SolicitudHoraExtra, { foreignKey: "aprobado_por", as: "solicitudes_hx_aprobadas" });
SolicitudHoraExtra.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(SolicitudVacaciones, { foreignKey: "id_colaborador" });
SolicitudVacaciones.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(SolicitudVacaciones, { foreignKey: "aprobado_por", as: "solicitudes_vac_aprobadas" });
SolicitudVacaciones.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(SolicitudPermisosLicencias, { foreignKey: "id_colaborador" });
SolicitudPermisosLicencias.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(SolicitudPermisosLicencias, { foreignKey: "aprobado_por", as: "permisos_aprobados" });
SolicitudPermisosLicencias.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(Telefono, { foreignKey: "id_colaborador" });
Telefono.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Direccion, { foreignKey: "id_colaborador" });
Direccion.belongsTo(Colaborador, { foreignKey: "id_colaborador" });


// -----------------------------
//  UBICACIÓN
// -----------------------------
Provincia.hasMany(Canton, { foreignKey: "id_provincia" });
Canton.belongsTo(Provincia, { foreignKey: "id_provincia" });

Canton.hasMany(Distrito, { foreignKey: "id_canton" });
Distrito.belongsTo(Canton, { foreignKey: "id_canton" });

Provincia.hasMany(Direccion, { foreignKey: "id_provincia" });
Direccion.belongsTo(Provincia, { foreignKey: "id_provincia" });

Canton.hasMany(Direccion, { foreignKey: "id_canton" });
Direccion.belongsTo(Canton, { foreignKey: "id_canton" });

Distrito.hasMany(Direccion, { foreignKey: "id_distrito" });
Direccion.belongsTo(Distrito, { foreignKey: "id_distrito" });


// -----------------------------
//  ORGANIZACIÓN
// -----------------------------
Departamento.hasMany(Puesto, { foreignKey: "id_departamento" });
Puesto.belongsTo(Departamento, { foreignKey: "id_departamento" });

Puesto.hasMany(Contrato, { foreignKey: "id_puesto" });
Contrato.belongsTo(Puesto, { foreignKey: "id_puesto" });

TipoContrato.hasMany(Contrato, { foreignKey: "id_tipo_contrato" });
Contrato.belongsTo(TipoContrato, { foreignKey: "id_tipo_contrato" });

TipoJornada.hasMany(Contrato, { foreignKey: "id_tipo_jornada" });
Contrato.belongsTo(TipoJornada, { foreignKey: "id_tipo_jornada" });

Contrato.hasMany(AjusteSalarial, { foreignKey: "id_contrato" });
AjusteSalarial.belongsTo(Contrato, { foreignKey: "id_contrato" });

Contrato.hasMany(HorarioLaboral, { foreignKey: "id_contrato" });
HorarioLaboral.belongsTo(Contrato, { foreignKey: "id_contrato" });


// -----------------------------
//  EVALUACIONES
// -----------------------------
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


// -----------------------------
//  PLANILLAS
// -----------------------------
PeriodoPlanilla.hasMany(DetallePlanilla, { foreignKey: "id_periodo" });
DetallePlanilla.belongsTo(PeriodoPlanilla, { foreignKey: "id_periodo" });

DetallePlanilla.hasMany(DeduccionPlanilla, { foreignKey: "id_detalle" });
DeduccionPlanilla.belongsTo(DetallePlanilla, { foreignKey: "id_detalle" });

TipoDeduccion.hasMany(DeduccionPlanilla, { foreignKey: "id_tipo_deduccion" });
DeduccionPlanilla.belongsTo(TipoDeduccion, { foreignKey: "id_tipo_deduccion" });


// -----------------------------
//  ASISTENCIA / INCAPACIDADES
// -----------------------------
TipoIncapacidad.hasMany(Incapacidad, { foreignKey: "id_tipo_incap" });
Incapacidad.belongsTo(TipoIncapacidad, { foreignKey: "id_tipo_incap" });

TipoMarca.hasMany(MarcaAsistencia, { foreignKey: "id_tipo_marca" });
MarcaAsistencia.belongsTo(TipoMarca, { foreignKey: "id_tipo_marca" });

TipoHoraExtra.hasMany(SolicitudHoraExtra, { foreignKey: "id_tipo_hx" });
SolicitudHoraExtra.belongsTo(TipoHoraExtra, { foreignKey: "id_tipo_hx" });


// -----------------------------
//  USUARIOS Y ROLES
// -----------------------------
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: "id_usuario" });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: "id_rol" });

Usuario.hasMany(BitacoraAuditoria, { foreignKey: "actor_id" });
BitacoraAuditoria.belongsTo(Usuario, { foreignKey: "actor_id" });


// ========================================
//  EXPORTS
// ========================================
export {
  sequelize,
  Colaborador,
  Usuario,
  Genero,
  Rol,
  UsuarioRol,
  BitacoraAuditoria,

  // Organización
  Departamento,
  Puesto,
  TipoContrato,
  Contrato,
  TipoJornada,
  HorarioLaboral,
  AjusteSalarial,

  // Evaluaciones
  RubroEvaluacion,
  Evaluacion,
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

  // Solicitudes y asistencia
  TipoMarca,
  MarcaAsistencia,
  TipoIncapacidad,
  Incapacidad,
  JornadaDiaria,
  SolicitudVacaciones,
  SolicitudHoraExtra,
  TipoHoraExtra,
  SolicitudPermisosLicencias,
  SaldoVacaciones,

  // Liquidaciones
  Liquidacion,

  // Otros
  Telefono,
  Estado
};
