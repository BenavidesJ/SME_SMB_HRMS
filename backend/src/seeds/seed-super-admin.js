import bcrypt from "bcrypt";
import { models, sequelize } from "../models/index.js";

const {
  Colaborador,
  Usuario,
  Rol,
  Estado,
  EstadoCivil,
  Direccion,
  Provincia,
  Canton,
  Distrito,
  Departamento,
  Puesto,
  TipoContrato,
  TipoJornada,
  Contrato,
  HorarioLaboral,
  SaldoVacaciones,
} = models;

async function requireCatalog(model, where, name, transaction) {
  const record = await model.findOne({ where, transaction });
  if (!record) {
    throw new Error(`[seed] Falta catalogo requerido: ${name}`);
  }
  return record;
}

function sanitizeUsernamePart(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "");
}

function buildAdminUsername(nombre, primerApellido, identificacion) {
  const initial = sanitizeUsernamePart(String(nombre ?? "").trim().charAt(0));
  const surname = sanitizeUsernamePart(String(primerApellido ?? "").trim().replace(/\s+/g, ""));
  const last4 = String(identificacion ?? "").slice(-4);

  if (!initial || !surname || last4.length !== 4) {
    throw new Error("[seed] No se pudo generar username con formato requerido");
  }

  return `${initial}${surname}${last4}`.toLowerCase();
}

export async function seedSuperAdmin() {
  const t = await sequelize.transaction();
  try {
    const estadoActivo = await requireCatalog(Estado, { estado: "ACTIVO" }, "Estado.ACTIVO", t);
    const estadoCivil = await requireCatalog(EstadoCivil, { estado_civil: "CASADO" }, "EstadoCivil.CASADO", t);
    const rolAdministrador = await requireCatalog(Rol, { nombre: "ADMINISTRADOR" }, "Rol.ADMINISTRADOR", t);
    const departamentoTI = await requireCatalog(
      Departamento,
      { nombre: "TECNOLOGÍAS DE INFORMACIÓN" },
      "Departamento.TECNOLOGÍAS DE INFORMACIÓN",
      t
    );
    const puesto = await requireCatalog(Puesto, { nombre: "INGENIERO DE SOFTWARE" }, "Puesto.INGENIERO DE SOFTWARE", t);

    if (
      Number(puesto.id_departamento) !== Number(departamentoTI.id_departamento) ||
      Number(puesto.estado) !== Number(estadoActivo.id_estado)
    ) {
      await puesto.update(
        {
          id_departamento: departamentoTI.id_departamento,
          estado: estadoActivo.id_estado,
        },
        { transaction: t }
      );
    }

    const tipoContrato = await requireCatalog(TipoContrato, { tipo_contrato: "INDEFINIDO" }, "TipoContrato.INDEFINIDO", t);
    const tipoJornada = await requireCatalog(TipoJornada, { tipo: "DIURNA" }, "TipoJornada.DIURNA", t);

    const [colab] = await Colaborador.findOrCreate({
      where: { identificacion: 115050783 },
      defaults: {
        nombre: "Jose Daniel",
        primer_apellido: "Benavides",
        segundo_apellido: "Obando",
        fecha_nacimiento: "1992-07-01",
        correo_electronico: "jdanielbenavides@hotmail.com",
        telefono: "70192643",
        cantidad_hijos: 0,
        estado_civil: estadoCivil.id_estado_civil,
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await colab.update(
      {
        correo_electronico: "jdanielbenavides@hotmail.com",
        telefono: "70192643",
        estado_civil: estadoCivil.id_estado_civil,
        estado: estadoActivo.id_estado,
      },
      { transaction: t }
    );

    const username = buildAdminUsername(colab.nombre, colab.primer_apellido, String(colab.identificacion));
    const passwordHash = await bcrypt.hash("pAssword123*", 10);

    let user = await Usuario.findOne({
      where: { id_colaborador: colab.id_colaborador },
      transaction: t,
    });

    if (!user) {
      const userByUsername = await Usuario.findOne({ where: { username }, transaction: t });
      if (userByUsername && Number(userByUsername.id_colaborador) !== Number(colab.id_colaborador)) {
        throw new Error(`[seed] Username ya existe para otro colaborador: ${username}`);
      }
      user = userByUsername;
    }

    if (!user) {
      user = await Usuario.create(
        {
          username,
          contrasena_hash: passwordHash,
          requiere_cambio_contrasena: false,
          id_colaborador: colab.id_colaborador,
          id_rol: rolAdministrador.id_rol,
          estado: estadoActivo.id_estado,
        },
        { transaction: t }
      );
    } else {
      await user.update(
        {
          username,
          contrasena_hash: passwordHash,
          requiere_cambio_contrasena: false,
          id_colaborador: colab.id_colaborador,
          id_rol: rolAdministrador.id_rol,
          estado: estadoActivo.id_estado,
        },
        { transaction: t }
      );
    }

    const provincia = await Provincia.findOne({ order: [["id_provincia", "ASC"]], transaction: t });
    if (!provincia) {
      throw new Error("[seed] Falta catalogo requerido: Provincia");
    }

    const canton = await Canton.findOne({
      where: { id_provincia: provincia.id_provincia },
      order: [["id_canton", "ASC"]],
      transaction: t,
    });
    if (!canton) {
      throw new Error(`[seed] Falta catalogo requerido: Canton para provincia ${provincia.id_provincia}`);
    }

    const distrito = await Distrito.findOne({
      where: { id_canton: canton.id_canton },
      order: [["id_distrito", "ASC"]],
      transaction: t,
    });
    if (!distrito) {
      throw new Error(`[seed] Falta catalogo requerido: Distrito para canton ${canton.id_canton}`);
    }

    if (provincia && canton && distrito) {
      const [direccionPrincipal] = await Direccion.findOrCreate({
        where: {
          id_colaborador: colab.id_colaborador,
          es_principal: 1,
        },
        defaults: {
          id_colaborador: colab.id_colaborador,
          id_provincia: provincia.id_provincia,
          id_canton: canton.id_canton,
          id_distrito: distrito.id_distrito,
          otros_datos: "Cerro Vista Ap 4A",
          es_principal: 1,
        },
        transaction: t,
      });

      await direccionPrincipal.update(
        {
          id_provincia: provincia.id_provincia,
          id_canton: canton.id_canton,
          id_distrito: distrito.id_distrito,
          otros_datos: "Cerro Vista Ap 4A",
          es_principal: 1,
        },
        { transaction: t }
      );
    }

    let contrato = await Contrato.findOne({
      where: { id_colaborador: colab.id_colaborador },
      order: [["fecha_inicio", "DESC"], ["id_contrato", "DESC"]],
      transaction: t,
    });

    const contratoPayload = {
      id_colaborador: colab.id_colaborador,
      id_puesto: puesto.id_puesto,
      fecha_inicio: "2025-01-16",
      id_tipo_contrato: tipoContrato.id_tipo_contrato,
      id_tipo_jornada: tipoJornada.id_tipo_jornada,
      horas_semanales: "48.00",
      salario_base: "2748000.00",
      id_jefe_directo: colab.id_colaborador,
      estado: estadoActivo.id_estado,
    };

    if (!contrato) {
      contrato = await Contrato.create(contratoPayload, { transaction: t });
    } else {
      await contrato.update(contratoPayload, { transaction: t });
    }

    const fechaActualizacion = new Date().toISOString().slice(0, 10);
    const horarioPayload = {
      id_contrato: contrato.id_contrato,
      hora_inicio: "09:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJVS",
      dias_libres: "D",
      estado: estadoActivo.id_estado,
      fecha_actualizacion: fechaActualizacion,
      id_tipo_jornada: tipoJornada.id_tipo_jornada,
    };

    const horarioExistente = await HorarioLaboral.findOne({
      where: { id_contrato: contrato.id_contrato },
      order: [["fecha_actualizacion", "DESC"], ["id_horario", "DESC"]],
      transaction: t,
    });

    if (!horarioExistente) {
      await HorarioLaboral.create(horarioPayload, { transaction: t });
    } else {
      await horarioExistente.update(horarioPayload, { transaction: t });
    }

    const [saldoVacaciones] = await SaldoVacaciones.findOrCreate({
      where: { id_colaborador: colab.id_colaborador },
      defaults: {
        id_colaborador: colab.id_colaborador,
        dias_ganados: "0.00",
        dias_tomados: "0.00",
      },
      transaction: t,
    });

    if (Number(saldoVacaciones.dias_ganados) !== 0 || Number(saldoVacaciones.dias_tomados) !== 0) {
      await saldoVacaciones.update(
        {
          dias_ganados: "0.00",
          dias_tomados: "0.00",
        },
        { transaction: t }
      );
    }

    await t.commit();
    console.log("[seed] Admin principal OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error admin principal:", err);
    throw err;
  }
}
