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
} = models;

export async function seedSuperAdmin() {
  const t = await sequelize.transaction();
  try {
    let estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      transaction: t,
    });

    if (!estadoActivo) {
      const maxId = Number(await Estado.max("id_estado", { transaction: t })) || 0;
      estadoActivo = await Estado.create(
        { id_estado: maxId + 1, estado: "ACTIVO" },
        { transaction: t }
      );
    }

    const [estadoCivil] = await EstadoCivil.findOrCreate({
      where: { estado_civil: "CASADO" },
      defaults: { estado_civil: "CASADO" },
      transaction: t,
    });

    const [rolSuperAdmin] = await Rol.findOrCreate({
      where: { nombre: "SUPER_ADMIN" },
      defaults: { nombre: "SUPER_ADMIN" },
      transaction: t,
    });

    const [departamentoTI] = await Departamento.findOrCreate({
      where: { nombre: "TECNOLOGÍAS DE INFORMACIÓN" },
      defaults: { nombre: "TECNOLOGÍAS DE INFORMACIÓN" },
      transaction: t,
    });

    const [puesto] = await Puesto.findOrCreate({
      where: { nombre: "INGENIERO DE SOFTWARE" },
      defaults: {
        id_departamento: departamentoTI.id_departamento,
        nombre: "INGENIERO DE SOFTWARE",
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

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

    const [tipoContrato] = await TipoContrato.findOrCreate({
      where: { tipo_contrato: "INDEFINIDO" },
      defaults: { tipo_contrato: "INDEFINIDO" },
      transaction: t,
    });

    const [tipoJornada] = await TipoJornada.findOrCreate({
      where: { tipo: "DIURNA" },
      defaults: {
        tipo: "DIURNA",
        max_horas_diarias: "8.00",
        max_horas_semanales: "48.00",
      },
      transaction: t,
    });

    if (
      Number(tipoJornada.max_horas_diarias) !== 8 ||
      Number(tipoJornada.max_horas_semanales) !== 48
    ) {
      await tipoJornada.update(
        {
          max_horas_diarias: "8.00",
          max_horas_semanales: "48.00",
        },
        { transaction: t }
      );
    }

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

    const username = "jbenavides0783";
    const passwordHash =
      "$2b$10$p2kovfeKLi/4sZ/A54pos.7E5RUcAXcuFXfS5MZ4keJB4Brz0bdNC";

    const [user] = await Usuario.findOrCreate({
      where: { username },
      defaults: {
        username,
        contrasena_hash: passwordHash,
        requiere_cambio_contrasena: false,
        id_colaborador: colab.id_colaborador,
        id_rol: rolSuperAdmin.id_rol,
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await user.update(
      {
        id_colaborador: colab.id_colaborador,
        id_rol: rolSuperAdmin.id_rol,
        estado: estadoActivo.id_estado,
      },
      { transaction: t }
    );

    const provincia = (await Provincia.findByPk(1, { transaction: t }))
      ?? (await Provincia.findOne({ order: [["id_provincia", "ASC"]], transaction: t }));
    const canton = (await Canton.findByPk(115, { transaction: t }))
      ?? (await Canton.findOne({ order: [["id_canton", "ASC"]], transaction: t }));
    const distrito = (await Distrito.findByPk(10203, { transaction: t }))
      ?? (await Distrito.findOne({ order: [["id_distrito", "ASC"]], transaction: t }));

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
      fecha_inicio: "2026-01-04",
      id_tipo_contrato: tipoContrato.id_tipo_contrato,
      id_tipo_jornada: tipoJornada.id_tipo_jornada,
      horas_semanales: "48.00",
      salario_base: "3000000.00",
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
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
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

    await t.commit();
    console.log("[seed] Super admin OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error super admin:", err);
    throw err;
  }
}
