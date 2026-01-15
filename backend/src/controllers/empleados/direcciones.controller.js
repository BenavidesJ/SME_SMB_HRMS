import { HTTP_CODES } from "../../common/strings.js";

// ====== PROVINCIA ======
import { crearProvincia } from "./handlers/direcciones/provincia/crearProvincia.js";
import { actualizarProvincia } from "./handlers/direcciones/provincia/actualizarProvincia.js";
import { eliminarProvincia } from "./handlers/direcciones/provincia/eliminarProvincia.js";
import { obtenerProvinciaPorIdHandler } from "./handlers/direcciones/provincia/obtenerProvincia.js";
import { obtenerProvinciasHandler } from "./handlers/direcciones/provincia/obtenerProvincias.js";

// ====== CANTÓN  ======
import { crearCanton } from "./handlers/direcciones/canton/crearCanton.js";
import { eliminarCanton } from "./handlers/direcciones/canton/eliminarCanton.js";
import { obtenerCantones } from "./handlers/direcciones/canton/obtenerCantones.js";
import { obtenerCantonesPorProvinciaHandler } from "./handlers/direcciones/canton/obtenerCantonesPorProvincia.js";
import { obtenerCantonPorIdHandler } from "./handlers/direcciones/canton/obtenerCantonPorId.js";
import { actualizarCanton } from "./handlers/direcciones/canton/actualizarCanton.js";

// ====== DISTRITO ======
import { crearDistrito } from "./handlers/direcciones/distrito/crearDistrito.js";
import { actualizarDistrito } from "./handlers/direcciones/distrito/actualizarDistrito.js";
import { eliminarDistrito } from "./handlers/direcciones/distrito/eliminarDistrito.js";
import { obtenerDistritos } from "./handlers/direcciones/distrito/obtenerDistritos.js";
import { obtenerDistritosPorCantonHandler } from "./handlers/direcciones/distrito/obtenerDistritosPorCanton.js";
import { obtenerDistritoPorIdHandler } from "./handlers/direcciones/distrito/obtenerDistritoPorId.js";

// ====== DIRECCIÓN  ======
import { crearDireccion } from "./handlers/direcciones/direccion/crearDireccion.js";
import { obtenerDireccionesPorColaborador } from "./handlers/direcciones/direccion/obtenerDireccionesPorColaborador.js";
import { obtenerDireccionPrincipal} from "./handlers/direcciones/direccion/obtenerDireccionPrincipal.js";
import { actualizarDireccion } from "./handlers/direcciones/direccion/actualizarDireccion.js";
import { desactivarDireccion } from "./handlers/direcciones/direccion/desactivarDireccion.js";


// PROVINCIAS 

export const obtenerProvincias = async (_req, res, next) => {
  try {
    const provincias = await obtenerProvinciasHandler();
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Provincias consultadas",
      data: provincias,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerProvincia = async (req, res, next) => {
  try {
    const { id_provincia } = req.params;
    const provincia = await obtenerProvinciaPorIdHandler(id_provincia);
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Provincia consultada",
      data: provincia,
    });
  } catch (error) {
    next(error);
  }
};

export const crearProvinciaController = async (req, res, next) => {
  try {
    const provincia = await crearProvincia(req.body);
    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Provincia creada correctamente",
      data: provincia,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarProvinciaController = async (req, res, next) => {
  try {
    const provincia = await actualizarProvincia({
      id: req.params.id_provincia,
      patch: req.body,
    });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Provincia actualizada correctamente",
      data: provincia,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarProvinciaController = async (req, res, next) => {
  try {
    const result = await eliminarProvincia({ id: req.params.id_provincia });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Provincia eliminada correctamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// CANTONES 

export const obtenerCantonesController = async (_req, res, next) => {
  try {
    const cantones = await obtenerCantones();
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantones consultados",
      data: cantones,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerCantonesPorProvincia = async (req, res, next) => {
  try {
    const { id_provincia } = req.params;
    const data = await obtenerCantonesPorProvinciaHandler(id_provincia);
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantones consultados",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerCanton = async (req, res, next) => {
  try {
    const canton = await obtenerCantonPorIdHandler(req.params.id_canton);
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantón consultado",
      data: canton,
    });
  } catch (error) {
    next(error);
  }
};

export const crearCantonController = async (req, res, next) => {
  try {
    const canton = await crearCanton(req.body);
    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Cantón creado correctamente",
      data: canton,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarCantonController = async (req, res, next) => {
  try {
    const canton = await actualizarCanton({
      id: req.params.id_canton,
      patch: req.body ?? {},
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantón actualizado correctamente",
      data: canton,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarCantonController = async (req, res, next) => {
  try {
    const result = await eliminarCanton({ id: req.params.id_canton });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantón eliminado correctamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// DISTRITOS
export const obtenerDistritosController = async (_req, res, next) => {
  try {
    const distritos = await obtenerDistritos();
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distritos consultados",
      data: distritos,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerDistritosPorCanton = async (req, res, next) => {
  try {
    const data = await obtenerDistritosPorCantonHandler(req.params.id_canton);
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distritos consultados",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerDistrito = async (req, res, next) => {
  try {
    const distrito = await obtenerDistritoPorIdHandler(req.params.id_distrito);
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distrito consultado",
      data: distrito,
    });
  } catch (error) {
    next(error);
  }
};

export const crearDistritoController = async (req, res, next) => {
  try {
    const distrito = await crearDistrito(req.body);
    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Distrito creado correctamente",
      data: distrito,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarDistritoController = async (req, res, next) => {
  try {
    const distrito = await actualizarDistrito({
      id: req.params.id_distrito,
      patch: req.body ?? {},
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distrito actualizado correctamente",
      data: distrito,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarDistritoController = async (req, res, next) => {
  try {
    const result = await eliminarDistrito({ id: req.params.id_distrito });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distrito eliminado correctamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// DIRECCIONES 
export const crearDireccionController = async (req, res, next) => {
  try {
    const direccion = await crearDireccion(req.body);

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Dirección creada correctamente",
      data: direccion,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerDireccionesPorColaboradorController = async (req, res, next) => {
  try {
    const { id_colaborador } = req.params;

    const direcciones = await obtenerDireccionesPorColaborador({ id_colaborador });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Direcciones consultadas",
      data: direcciones,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerDireccionPrincipalController = async (req, res, next) => {
  try {
    const { id_colaborador } = req.params;

    const principal = await obtenerDireccionPrincipal({ id_colaborador });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Dirección principal consultada",
      data: principal,
    });
  } catch (error) {
    next(error);
  }
};


export const actualizarDireccionController = async (req, res, next) => {
  try {
    const { id_direccion } = req.params;

    const direccion = await actualizarDireccion({
      id: id_direccion,
      patch: req.body ?? {},
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Dirección actualizada correctamente",
      data: direccion,
    });
  } catch (error) {
    next(error);
  }
};

export const desactivarDireccionController = async (req, res, next) => {
  try {
    const { id_direccion } = req.params;

    const result = await desactivarDireccion({ id: id_direccion });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Dirección desactivada correctamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
