import express from "express";

import { authorization } from "../middlewares/authorization.js";
import { estadoControllers } from "../modules/mantenimientos_consultas/estado/controller/estado.controller.js";
import { cantonControllers } from "../modules/mantenimientos_consultas/canton/controllers/canton.controller.js";
import { causaLiquidacionControllers } from "../modules/mantenimientos_consultas/causa_liquidacion/controllers/causa_liquidacion.controller.js";
import { cicloPagoControllers } from "../modules/mantenimientos_consultas/ciclo_pago/controllers/ciclo_pago.controller.js";
import { deduccionControllers } from "../modules/mantenimientos_consultas/deduccion/controllers/deduccion.controller.js";
import { departamentoControllers } from "../modules/mantenimientos_consultas/departamento/controllers/departamento.controller.js";
import { distritoControllers } from "../modules/mantenimientos_consultas/distrito/controllers/distrito.controller.js";
import { estadoCivilControllers } from "../modules/mantenimientos_consultas/estado_civil/controllers/estado_civil.controller.js";
import { feriadoControllers } from "../modules/mantenimientos_consultas/feriado/controllers/feriado.controller.js";
import { provinciaControllers } from "../modules/mantenimientos_consultas/provincia/controllers/provincia.controller.js";
import { rolControllers } from "../modules/mantenimientos_consultas/rol/controllers/rol.controller.js";
import { tipoContratoControllers } from "../modules/mantenimientos_consultas/tipo_contrato/controllers/tipo_contrato.controller.js";
import { tipoHoraExtraControllers } from "../modules/mantenimientos_consultas/tipo_hora_extra/controllers/tipo_hora_extra.controller.js";
import { tipoIncapacidadControllers } from "../modules/mantenimientos_consultas/tipo_incapacidad/controllers/tipo_incapacidad.controller.js";
import { tipoJornadaControllers } from "../modules/mantenimientos_consultas/tipo_jornada/controllers/tipo_jornada.controller.js";
import { tipoMarcaControllers } from "../modules/mantenimientos_consultas/tipo_marca/controllers/tipo_marca.controller.js";
import { empleadoControllers, contratoControllers } from "../modules/mantenimientos_consultas/empleado/empleado.controller.js";
import { puestoControllers } from "../modules/mantenimientos_consultas/puesto/controllers/puesto.controller.js";

const router = express.Router();

const bindCrudRoutes = (basePath, controllers) => {
	router.post(basePath, authorization, controllers.createController);
	router.get(basePath, authorization, controllers.listController);
	router.get(`${basePath}/:id`, authorization, controllers.detailController);
	router.patch(`${basePath}/:id`, authorization, controllers.updateController);
	router.delete(`${basePath}/:id`, authorization, controllers.deleteController);
};

[
	{ path: "/estados", controllers: estadoControllers },
	{ path: "/estados-civiles", controllers: estadoCivilControllers },
	{ path: "/provincias", controllers: provinciaControllers },
	{ path: "/cantones", controllers: cantonControllers },
	{ path: "/distritos", controllers: distritoControllers },
	{ path: "/departamentos", controllers: departamentoControllers },
	{ path: "/puestos", controllers: puestoControllers },
	{ path: "/empleados", controllers: empleadoControllers },
	{ path: "/roles", controllers: rolControllers },
	{ path: "/causas-liquidacion", controllers: causaLiquidacionControllers },
	{ path: "/ciclos-pago", controllers: cicloPagoControllers },
	{ path: "/deducciones", controllers: deduccionControllers },
	{ path: "/feriados", controllers: feriadoControllers },
	{ path: "/tipos-contrato", controllers: tipoContratoControllers },
	{ path: "/tipos-hora-extra", controllers: tipoHoraExtraControllers },
	{ path: "/tipos-incapacidad", controllers: tipoIncapacidadControllers },
	{ path: "/tipos-jornada", controllers: tipoJornadaControllers },
	{ path: "/tipos-marca", controllers: tipoMarcaControllers },
].forEach(({ path, controllers }) => bindCrudRoutes(path, controllers));

router.get("/empleados/:id/contratos", authorization, contratoControllers.listByColaborador);
router.post("/empleados/:id/contratos", authorization, contratoControllers.createForColaborador);
router.patch("/empleados/:id/contratos/:contratoId", authorization, contratoControllers.updateForColaborador);

export default router;
