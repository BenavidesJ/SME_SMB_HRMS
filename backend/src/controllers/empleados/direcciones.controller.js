import { HTTP_CODES } from "../../common/strings.js";
import { Canton, Distrito, Provincia } from "../../models/index.js";

// Obtener Provincia
export const obtenerProvincias = async (_req, res, next) => {
  try {

    const provinces = await Provincia.findAll();

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Provincia consultadas",
      data: {
        provinces,
      }
    });
  } catch (error) {
    next(error);
  }
}

export const obtenerProvincia = async (req, res, next) => {
  const {
    id
  } = req.params;
  try {

    const province = await Provincia.findByPk(id);

    if (!province) throw new Error("La provincia con el id ingresado no esta registrada.");

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Provincia consultadas",
      data: {
        province,
      }
    });
  } catch (error) {
    next(error);
  }
}
// Crear Provincia
export const crearProvincia = async (req, res, next) => {
  const { nombre } = req.body;
  try {
    if (!nombre) throw new Error("El nombre es obligatorio.");

    const newProvince = await Provincia.create({ nombre });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Provincia creada correctamente",
      data: {
        id: newProvince.id_provincia,
        nombre: newProvince.nombre
      }
    });
  } catch (error) {
    next(error);
  }
}

// Obtener Cantones por Provincia
export const obtenerCantonesPorProvincia = async (req, res, next) => {
  const { provincia } = req.body;
  try {
    if (!provincia) throw new Error("La provincia es obligatoria.");

    const province = await Provincia.findOne({ where: { nombre: provincia } });

    if (!province) throw new Error("La provincia ingresada no existe o no ha sido registrada.");

    const cantones = await Canton.findAll({ where: { id_provincia: province.id_provincia } });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantones consultados",
      data: {
        cantones,
      }
    });
  } catch (error) {
    next(error);
  }
}
// Crear Cantón
export const crearCanton = async (req, res, next) => {
  const { nombre, provincia } = req.body;
  try {
    if (!nombre) throw new Error("El nombre es obligatorio.");
    if (!provincia) throw new Error("La provincia es obligatoria.");

    const province = await Provincia.findOne({ where: { nombre: provincia } })

    if (!province) throw new Error("La provincia ingresada no existe o no ha sido registrada.");

    const newCanton = await Canton.create({ id_provincia: province.id_provincia, nombre });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Cantón creado correctamente",
      data: {
        id: newCanton.id_canton,
        nombre: newCanton.nombre,
        provincia: province,
      }
    });
  } catch (error) {
    next(error);
  }
}

// Obtener Distritos por Cantón
export const obtenerDistritoPorCanton = async (req, res, next) => {
  const { canton } = req.body;
  try {
    if (!canton) throw new Error("El cantón es obligatorio.");

    const cantonProv = await Canton.findOne({ where: { nombre: canton } });

    if (!cantonProv) throw new Error("El canton ingresado no existe o no ha sido registrado.");

    const distritos = await Distrito.findAll({ where: { id_canton: cantonProv.id_canton } });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distritos consultados",
      data: {
        distritos,
      }
    });
  } catch (error) {
    next(error);
  }
}
// Crear Distrito
export const crearDistrito = async (req, res, next) => {
  const { nombre, canton } = req.body;
  try {
    if (!nombre) throw new Error("El nombre es obligatorio.");
    if (!canton) throw new Error("El canton es obligatorio.");

    const cantonProv = await Canton.findOne({ where: { nombre: canton } })

    if (!cantonProv) throw new Error("El cantón ingresado no existe o no ha sido registrado.");

    const newDistrito = await Distrito.create({ id_canton: cantonProv.id_canton, nombre });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Distrito creado correctamente",
      data: {
        id: newDistrito.id_distrito,
        nombre: newDistrito.nombre,
        canton: cantonProv,
      }
    });
  } catch (error) {
    next(error);
  }
}
