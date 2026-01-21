import dayjs from "dayjs";
import {
  sequelize,
  Colaborador,
  Telefono,
  Direccion,
  Genero,
  EstadoCivil,
  Provincia,
  Canton,
  Distrito,
  Estado,
  Usuario,
  Rol,
} from "../../../../models/index.js";

/**
 * Modificar Colaborador
 *
 * @param {{
 *   id_colaborador: number|string,
 *   patch: {
 *     nombre?: string,
 *     primer_apellido?: string,
 *     segundo_apellido?: string,
 *     genero?: string,
 *     identificacion?: string|number,
 *     fecha_nacimiento?: string,
 *     correo_electronico?: string,
 *     fecha_ingreso?: string,
 *     cantidad_hijos?: number|string,
 *     estado_civil?: string,
 *     telefono?: string|number|null,
 *     rol?: string, // actualiza roles del usuario del colaborador
 *     direccion?: {
 *       provincia?: string,
 *       canton?: string,
 *       distrito?: string,
 *       otros_datos?: string|null
 *     },
 *     estado?: string|number // ACTIVO/INACTIVO o id_estado
 *   }
 * }} params
 *
 * @returns {Promise<object>}
 */
export const modificarColaborador = async ({ id_colaborador, patch = {} }) => {
  const tx = await sequelize.transaction();

  try {
    if (id_colaborador === undefined || id_colaborador === null || String(id_colaborador).trim() === "") {
      throw new Error("El campo para id colaborador es obligatorio");
    }

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El formato del body es inválido");
    }

    const allowedFields = new Set([
      "nombre",
      "primer_apellido",
      "segundo_apellido",
      "genero",
      "identificacion",
      "fecha_nacimiento",
      "correo_electronico",
      "fecha_ingreso",
      "cantidad_hijos",
      "estado_civil",
      "telefono",
      "rol",
      "direccion",
      "estado",
    ]);

    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) {
      throw new Error("No se enviaron campos para actualizar");
    }

    for (const key of patchKeys) {
      if (!allowedFields.has(key)) throw new Error(`Campo no permitido en el body: ${key}`);
    }

    const id = Number(id_colaborador);
    if (!Number.isInteger(id) || id <= 0) throw new Error("id_colaborador debe ser un número entero válido");

    const current = await Colaborador.findByPk(id, { transaction: tx });
    if (!current) throw new Error(`No existe un colaborador con id ${id}`);

    const [user, telefonoActual, direccionActual] = await Promise.all([
      Usuario.findOne({
        where: { id_colaborador: id },
        transaction: tx,
      }),
      Telefono.findOne({
        where: { id_colaborador: id, es_principal: true },
        transaction: tx,
      }),
      Direccion.findOne({
        where: { id_colaborador: id, es_principal: true },
        transaction: tx,
      }),
    ]);

    const updates = {};

    const normalizeName = (v, field) => {
      const s = String(v ?? "").trim();
      if (!s) throw new Error(`${field} no puede ser vacío`);
      return s;
    };

    if (patch.nombre !== undefined) updates.nombre = normalizeName(patch.nombre, "nombre");
    if (patch.primer_apellido !== undefined)
      updates.primer_apellido = normalizeName(patch.primer_apellido, "primer_apellido");
    if (patch.segundo_apellido !== undefined)
      updates.segundo_apellido = normalizeName(patch.segundo_apellido, "segundo_apellido");

    if (patch.identificacion !== undefined) {
      const ident = String(patch.identificacion).trim();
      if (!/^\d+$/.test(ident)) throw new Error("identificacion debe contener solo números");

      const exists = await Colaborador.findOne({
        where: { identificacion: ident },
        transaction: tx,
      });

      if (exists && Number(exists.id_colaborador) !== id) {
        throw new Error(`Ya existe un colaborador con el número de identificación: ${ident}`);
      }

      updates.identificacion = ident;
    }

    const validateDate = (value, fieldName) => {
      const d = dayjs(value);
      if (!d.isValid()) throw new Error(`${fieldName} no tiene un formato válido`);
      return d;
    };

    if (patch.fecha_nacimiento !== undefined) {
      const birthDate = validateDate(patch.fecha_nacimiento, "fecha_nacimiento");
      const edad = dayjs().diff(birthDate, "year");
      if (edad < 18) {
        throw new Error("Esta persona no se puede agregar porque es menor de edad segun la ley costarricense");
      }
      updates.fecha_nacimiento = birthDate.format("YYYY-MM-DD");
    }

    if (patch.fecha_ingreso !== undefined) {
      const ingreso = validateDate(patch.fecha_ingreso, "fecha_ingreso");
      updates.fecha_ingreso = ingreso.format("YYYY-MM-DD");
    }

    if (patch.correo_electronico !== undefined) {
      const email = String(patch.correo_electronico).trim();
      if (!email) throw new Error("correo_electronico no puede ser vacío");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("correo_electronico no tiene un formato válido");
      updates.correo_electronico = email;
    }

    if (patch.cantidad_hijos !== undefined) {
      const n = Number(patch.cantidad_hijos);
      if (!Number.isInteger(n) || n < 0) throw new Error("cantidad_hijos debe ser un entero mayor o igual a 0");
      if (n > 50) throw new Error("cantidad_hijos es demasiado alto");
      updates.cantidad_hijos = n;
    }

    if (patch.genero !== undefined) {
      const genderValue = String(patch.genero).trim().toUpperCase();
      if (!genderValue) throw new Error("genero no puede ser vacío");

      const gender = await Genero.findOne({
        where: { genero: genderValue },
        transaction: tx,
      });

      if (!gender) throw new Error(`El género '${patch.genero}' no existe.`);
      updates.id_genero = gender.id_genero;
    }

    if (patch.estado_civil !== undefined) {
      const maritalStatusValue = String(patch.estado_civil).trim().toUpperCase();
      if (!maritalStatusValue) throw new Error("estado_civil no puede ser vacío");

      const maritalStatus = await EstadoCivil.findOne({
        where: { estado_civil: maritalStatusValue },
        transaction: tx,
      });

      if (!maritalStatus) throw new Error(`El estado civil '${patch.estado_civil}' no existe.`);
      updates.estado_civil = maritalStatus.id_estado_civil;
    }

    if (patch.estado !== undefined) {
      let newEstadoId = null;

      const maybeNum = Number(String(patch.estado).trim());
      if (Number.isFinite(maybeNum) && String(patch.estado).trim() !== "") {
        const st = await Estado.findByPk(maybeNum, { transaction: tx });
        if (!st) throw new Error(`No existe el estado con id ${maybeNum}`);
        newEstadoId = st.id_estado;
      } else {
        const estadoTxt = String(patch.estado).trim().toUpperCase();
        if (!estadoTxt) throw new Error("estado no puede ser vacío");

        const estadoDb = await Estado.findOne({
          where: { estado: estadoTxt },
          attributes: ["id_estado", "estado"],
          transaction: tx,
        });

        if (!estadoDb) throw new Error(`No existe un estado: ${patch.estado}`);
        newEstadoId = estadoDb.id_estado;
      }

      updates.estado = newEstadoId;
    }

    if (patch.direccion !== undefined) {
      if (patch.direccion === null || typeof patch.direccion !== "object" || Array.isArray(patch.direccion)) {
        throw new Error("direccion debe ser un objeto");
      }

      const dirAllowed = new Set(["provincia", "canton", "distrito", "otros_datos"]);
      for (const k of Object.keys(patch.direccion)) {
        if (!dirAllowed.has(k)) throw new Error(`Campo no permitido en direccion: ${k}`);
      }

      const provTxt = patch.direccion.provincia !== undefined ? String(patch.direccion.provincia).trim() : undefined;
      const cantTxt = patch.direccion.canton !== undefined ? String(patch.direccion.canton).trim() : undefined;
      const distTxt = patch.direccion.distrito !== undefined ? String(patch.direccion.distrito).trim() : undefined;
      const otros =
        patch.direccion.otros_datos === undefined
          ? undefined
          : patch.direccion.otros_datos === null
            ? null
            : String(patch.direccion.otros_datos).trim();

      const anyGeoProvided = provTxt !== undefined || cantTxt !== undefined || distTxt !== undefined;
      if (anyGeoProvided) {
        if (!provTxt || !cantTxt || !distTxt) {
          throw new Error("Para actualizar provincia/canton/distrito debes enviar los 3 campos dentro de direccion");
        }

        const [foundProv, foundCant, foundDist] = await Promise.all([
          Provincia.findOne({ where: { nombre: provTxt }, transaction: tx }),
          Canton.findOne({ where: { nombre: cantTxt }, transaction: tx }),
          Distrito.findOne({ where: { nombre: distTxt }, transaction: tx }),
        ]);

        if (!foundProv) throw new Error(`La provincia '${provTxt}' no existe.`);
        if (!foundCant) throw new Error(`El cantón '${cantTxt}' no existe.`);
        if (!foundDist) throw new Error(`El distrito '${distTxt}' no existe.`);

        const activeStatus = await Estado.findOne({ where: { estado: "ACTIVO" }, transaction: tx });
        if (!activeStatus) throw new Error("No existe el estado 'ACTIVO' en el catálogo estado");

        const dirPayload = {
          id_colaborador: id,
          id_provincia: foundProv.id_provincia,
          id_canton: foundCant.id_canton,
          id_distrito: foundDist.id_distrito,
          otros_datos: otros === undefined ? direccionActual?.otros_datos ?? null : otros,
          es_principal: true,
          estado: activeStatus.id_estado,
        };

        if (direccionActual) {
          await direccionActual.update(dirPayload, { transaction: tx });
        } else {
          await Direccion.create(dirPayload, { transaction: tx });
        }
      } else if (otros !== undefined) {
        if (direccionActual) {
          await direccionActual.update(
            { otros_datos: otros, fecha_actualizacion: dayjs().format("YYYY-MM-DD") },
            { transaction: tx },
          );
        } else {
          throw new Error("No existe una dirección principal. Para crearla debes enviar provincia/canton/distrito");
        }
      }
    }

    if (patch.telefono !== undefined) {
      const raw = patch.telefono;

      const isEmpty = raw === null || String(raw).trim() === "";
      if (isEmpty) {
        if (telefonoActual) await telefonoActual.destroy({ transaction: tx });
      } else {
        const tel = String(raw).trim();
        if (!/^\d+$/.test(tel)) throw new Error("telefono debe contener solo números");
        if (tel.length < 8 || tel.length > 15) throw new Error("telefono debe tener entre 8 y 15 dígitos");

        if (telefonoActual) {
          await telefonoActual.update({ numero: Number(tel), es_principal: true }, { transaction: tx });
        } else {
          await Telefono.create(
            { id_colaborador: id, numero: Number(tel), es_principal: true },
            { transaction: tx },
          );
        }
      }
    }

    if (patch.rol !== undefined) {
      const roleValue = String(patch.rol).trim().toUpperCase();
      if (!roleValue) throw new Error("rol no puede ser vacío");

      if (!user) {
        throw new Error("Este colaborador no tiene usuario asociado, no se puede modificar rol");
      }

      const foundRole = await Rol.findOne({ where: { nombre: roleValue }, transaction: tx });
      if (!foundRole) throw new Error(`El rol '${patch.rol}' no existe.`);

      await user.setRols([foundRole], { transaction: tx });
    }

    if (Object.keys(updates).length > 0) {
      updates.fecha_actualizacion = dayjs().format("YYYY-MM-DD");
      await current.update(updates, { transaction: tx });
    }

    const touchedNested = patch.telefono !== undefined || patch.direccion !== undefined || patch.rol !== undefined;
    if (Object.keys(updates).length === 0 && !touchedNested) {
      throw new Error("No hay cambios efectivos para aplicar");
    }

    const [estadoFinal, generoFinal, estadoCivilFinal, rolFinal] = await Promise.all([
      Estado.findByPk(current.estado, { attributes: ["estado"], transaction: tx }),
      Genero.findByPk(current.id_genero, { attributes: ["genero"], transaction: tx }),
      EstadoCivil.findByPk(current.estado_civil, { attributes: ["estado_civil"], transaction: tx }),
      user
        ? user.getRols({ attributes: ["nombre"], joinTableAttributes: [], transaction: tx })
        : Promise.resolve([]),
    ]);

    await tx.commit();

    return {
      id_colaborador: current.id_colaborador,
      nombre: current.nombre,
      primer_apellido: current.primer_apellido,
      segundo_apellido: current.segundo_apellido,
      identificacion: current.identificacion,
      correo_electronico: current.correo_electronico,
      fecha_ingreso: current.fecha_ingreso,
      fecha_nacimiento: current.fecha_nacimiento,
      cantidad_hijos: current.cantidad_hijos,
      genero: generoFinal?.genero ?? current.id_genero,
      estado_civil: estadoCivilFinal?.estado_civil ?? current.estado_civil,
      estado: estadoFinal?.estado ?? current.estado,
      roles: Array.isArray(rolFinal) ? rolFinal.map((r) => r.nombre) : [],
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
