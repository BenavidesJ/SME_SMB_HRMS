import bcrypt from "bcrypt";
import dayjs from "dayjs";
import { HTTP_CODES } from "../../common/strings.js";
import { Colaborador, Usuario } from "../../models/index.js";
import { sendEmail } from "../../services/mail.js";

export const crearEmpleado = async (req, res, next) => {
  const {
    nombre,
    primer_apellido,
    segundo_apellido,
    nacionalidad,
    genero,
    identificacion,
    fecha_nacimiento,
    correo_electronico,
    fecha_ingreso,
  } = req.body;
  try {
    const requiredFields = [
      "nombre",
      "primer_apellido",
      "segundo_apellido",
      "nacionalidad",
      "genero",
      "identificacion",
      "fecha_nacimiento",
      "correo_electronico",
      "fecha_ingreso"
    ];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const employee = await Colaborador.create({
      nombre,
      primer_apellido,
      segundo_apellido,
      nacionalidad,
      genero,
      identificacion,
      fecha_nacimiento,
      correo_electronico,
      fecha_ingreso,
    });

    if (!employee) throw new Error("El colaborador no se pudo crear");

    const username = `${employee.nombre.slice(0, 1)}${employee.primer_apellido}${employee.identificacion.slice(-4)}`;
    const temporalPass = "pAssword123*"
    const contrasena_hash = await bcrypt.hash(temporalPass, 10);

    await Usuario.create({
      username,
      contrasena_hash,
      activo: 1,
      req_cambio_pass: 1,
      ultimo_cambio_pass: dayjs("9999-12-31").format("YYYY-MM-DD HH:mm:ss"),
      ultimo_acceso_en: dayjs("9999-12-31").format("YYYY-MM-DD HH:mm:ss"),
      id_colaborador: employee.id_colaborador
    })

    await sendEmail({
      recipient: correo_electronico,
      subject: "Bienvenido a BioAlquimia!",
      message: `Hola ${nombre} ${primer_apellido} ${segundo_apellido}! Bienvenido a BioAlquimia. 
      Tu usuario para ingresar al sistema es username: ${username} password: ${temporalPass}.
      Por favor una vez al ingresar cambia tu password
      `
    })

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Empleado y usuario creados correctamente",
      data: {}
    });
  } catch (error) {
    next(error);
  }
};