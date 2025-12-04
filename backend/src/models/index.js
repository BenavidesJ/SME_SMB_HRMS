import { sequelize } from "../config/db.js";

import { TipoDeduccion } from "./tipo_deduccion.js";
import { RubroEvaluacion } from "./rubro_evaluacion.js";
import { TipoJornada } from "./tipo_jornada.js";
import { CicloEvaluacion } from "./ciclo_evaluacion.js";
import { Colaborador } from "./colaborador.js";
import { Evaluacion } from "./evaluacion.js";
import { EvaluacionRubro } from "./evaluacion_rubro.js";
import { TipoContrato } from "./tipo_contrato.js";
import { Departamento } from "./departamento.js";
import { Puesto } from "./puesto.js";
import { Contrato } from "./contrato.js";
import { AjusteSalarial } from "./ajuste_salarial.js";
import { Usuario } from "./usuario.js";
import { BitacoraAuditoria } from "./bitacora_auditoria.js";
import { Provincia } from "./provincia.js";
import { Canton } from "./canton.js";
import { CasoTerminacion } from "./caso_terminacion.js";
import { PeriodoPlanilla } from "./periodo_planilla.js";
import { DetallePlanilla } from "./detalle_planilla.js";
import { DeduccionPlanilla } from "./deduccion_planilla.js";
import { Distrito } from "./distrito.js";
import { Direccion } from "./direccion.js";
import { HorarioLaboral } from "./horario_laboral.js";
import { TipoIncapacidad } from "./tipo_incapacidad.js";
import { Incapacidad } from "./incapacidad.js";
import { JornadaDiaria } from "./jornada_diaria.js";
import { TipoMarca } from "./tipo_marca.js";
import { MarcaAsistencia } from "./marca_asistencia.js";
import { RegistroAguinaldo } from "./registro_aguinaldo.js";
import { Rol } from "./rol.js";
import { SaldoVacaciones } from "./saldo_vacaciones.js";
import { TipoHoraExtra } from "./tipo_hora_extra.js";
import { SolicitudHoraExtra } from "./solicitud_hora_extra.js";
import { SolicitudVacaciones } from "./solicitud_vacaciones.js";
import { SolicitudPermisosLicencias } from "./solicitud_permisos_licencias.js";
import { Telefono } from "./telefono.js";
import { UsuarioRol } from "./usuario_rol.js";

// Relaciones Colaborador
Colaborador.hasMany(Contrato, { foreignKey: "id_colaborador" });
Contrato.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Evaluacion, { foreignKey: "id_colaborador", as: "evaluaciones" });
Evaluacion.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(Evaluacion, { foreignKey: "id_evaluador", as: "evaluaciones_realizadas" });
Evaluacion.belongsTo(Colaborador, { foreignKey: "id_evaluador", as: "evaluador" });

Colaborador.hasMany(Usuario, { foreignKey: "id_colaborador" });
Usuario.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(CasoTerminacion, { foreignKey: "id_colaborador" });
CasoTerminacion.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(CasoTerminacion, { foreignKey: "aprobado_por", as: "casos_aprobados" });
CasoTerminacion.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

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

Colaborador.hasMany(RegistroAguinaldo, { foreignKey: "id_colaborador" });
RegistroAguinaldo.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(RegistroAguinaldo, { foreignKey: "aprobado_por", as: "aguinaldos_aprobados" });
RegistroAguinaldo.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(SaldoVacaciones, { foreignKey: "id_colaborador" });
SaldoVacaciones.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(SolicitudHoraExtra, { foreignKey: "id_colaborador" });
SolicitudHoraExtra.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(SolicitudHoraExtra, { foreignKey: "aprobado_por", as: "solicitudes_hx_aprobadas" });
SolicitudHoraExtra.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(SolicitudVacaciones, { foreignKey: "id_colaborador" });
SolicitudVacaciones.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(SolicitudVacaciones, { foreignKey: "aprobado_por", as: "solicitudes_vac_aprobadas" });
SolicitudVacaciones.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(SolicitudPermisosLicencias, { foreignKey: "id_colaborador" });
SolicitudPermisosLicencias.belongsTo(Colaborador, { foreignKey: "id_colaborador", as: "colaborador" });

Colaborador.hasMany(SolicitudPermisosLicencias, { foreignKey: "aprobado_por", as: "permisos_aprobados" });
SolicitudPermisosLicencias.belongsTo(Colaborador, { foreignKey: "aprobado_por", as: "aprobador" });

Colaborador.hasMany(Telefono, { foreignKey: "id_colaborador" });
Telefono.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

Colaborador.hasMany(Direccion, { foreignKey: "id_colaborador" });
Direccion.belongsTo(Colaborador, { foreignKey: "id_colaborador" });

// Departamento / Puesto / Contrato
Departamento.hasMany(Puesto, { foreignKey: "id_departamento" });
Puesto.belongsTo(Departamento, { foreignKey: "id_departamento" });

Puesto.hasMany(Contrato, { foreignKey: "id_puesto" });
Contrato.belongsTo(Puesto, { foreignKey: "id_puesto" });

// TipoContrato / TipoJornada
TipoContrato.hasMany(Contrato, { foreignKey: "id_tipo_contrato" });
Contrato.belongsTo(TipoContrato, { foreignKey: "id_tipo_contrato" });

TipoJornada.hasMany(Contrato, { foreignKey: "id_tipo_jornada" });
Contrato.belongsTo(TipoJornada, { foreignKey: "id_tipo_jornada" });

TipoJornada.hasMany(HorarioLaboral, { foreignKey: "id_tipo_jornada" });
HorarioLaboral.belongsTo(TipoJornada, { foreignKey: "id_tipo_jornada" });

// Contrato dependientes
Contrato.hasMany(AjusteSalarial, { foreignKey: "id_contrato" });
AjusteSalarial.belongsTo(Contrato, { foreignKey: "id_contrato" });

Contrato.hasMany(HorarioLaboral, { foreignKey: "id_contrato" });
HorarioLaboral.belongsTo(Contrato, { foreignKey: "id_contrato" });

Contrato.hasMany(DetallePlanilla, { foreignKey: "id_contrato" });
DetallePlanilla.belongsTo(Contrato, { foreignKey: "id_contrato" });

// CicloEvaluacion / Evaluacion / Rubros
CicloEvaluacion.hasMany(Evaluacion, { foreignKey: "id_ciclo" });
Evaluacion.belongsTo(CicloEvaluacion, { foreignKey: "id_ciclo" });

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

// PeriodoPlanilla / DetallePlanilla / Deducciones
PeriodoPlanilla.hasMany(DetallePlanilla, { foreignKey: "id_periodo" });
DetallePlanilla.belongsTo(PeriodoPlanilla, { foreignKey: "id_periodo" });

DetallePlanilla.hasMany(DeduccionPlanilla, { foreignKey: "id_detalle" });
DeduccionPlanilla.belongsTo(DetallePlanilla, { foreignKey: "id_detalle" });

TipoDeduccion.hasMany(DeduccionPlanilla, { foreignKey: "id_tipo_deduccion" });
DeduccionPlanilla.belongsTo(TipoDeduccion, { foreignKey: "id_tipo_deduccion" });

// Ubicación: Provincia / Cantón / Distrito / Dirección
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

// Incapacidad
TipoIncapacidad.hasMany(Incapacidad, { foreignKey: "id_tipo_incap" });
Incapacidad.belongsTo(TipoIncapacidad, { foreignKey: "id_tipo_incap" });

// Asistencia
TipoMarca.hasMany(MarcaAsistencia, { foreignKey: "id_tipo_marca" });
MarcaAsistencia.belongsTo(TipoMarca, { foreignKey: "id_tipo_marca" });

// TipoHoraExtra / SolicitudHoraExtra
TipoHoraExtra.hasMany(SolicitudHoraExtra, { foreignKey: "id_tipo_hx" });
SolicitudHoraExtra.belongsTo(TipoHoraExtra, { foreignKey: "id_tipo_hx" });

// Usuario / Rol / UsuarioRol
Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: "id_usuario",
  otherKey: "id_rol",
});
Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: "id_rol",
  otherKey: "id_usuario",
});

// Usuario / Bitácora
Usuario.hasMany(BitacoraAuditoria, { foreignKey: "actor_id" });
BitacoraAuditoria.belongsTo(Usuario, { foreignKey: "actor_id" });

export {
  sequelize,
  TipoDeduccion,
  RubroEvaluacion,
  TipoJornada,
  CicloEvaluacion,
  Colaborador,
  Evaluacion,
  EvaluacionRubro,
  TipoContrato,
  Departamento,
  Puesto,
  Contrato,
  AjusteSalarial,
  Usuario,
  BitacoraAuditoria,
  Provincia,
  Canton,
  CasoTerminacion,
  PeriodoPlanilla,
  DetallePlanilla,
  DeduccionPlanilla,
  Distrito,
  Direccion,
  HorarioLaboral,
  TipoIncapacidad,
  Incapacidad,
  JornadaDiaria,
  TipoMarca,
  MarcaAsistencia,
  RegistroAguinaldo,
  Rol,
  SaldoVacaciones,
  TipoHoraExtra,
  SolicitudHoraExtra,
  SolicitudVacaciones,
  SolicitudPermisosLicencias,
  Telefono,
  UsuarioRol,
};
