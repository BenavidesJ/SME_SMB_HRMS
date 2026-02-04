import { models, sequelize } from "../models/index.js";

const {
  Colaborador,
  Usuario,
  Rol,
  Estado,
  EstadoCivil,
  Contrato,
  HorarioLaboral,
  Direccion,
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

    const [colab] = await Colaborador.findOrCreate({
      where: { identificacion: 115050783 },
      defaults: {
        nombre: "Jose Daniel",
        primer_apellido: "Benavides",
        segundo_apellido: "Obando",
        fecha_nacimiento: "1992-07-01",
        correo_electronico: "jdanielbenavides@hotmail.com",
        telefono: "70192643",
        fecha_ingreso: new Date(),
        cantidad_hijos: false,
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
      { transaction: t },
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
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await user.update(
      {
        id_colaborador: colab.id_colaborador,
        estado: estadoActivo.id_estado,
      },
      { transaction: t },
    );

    await Rol.findOrCreate({
      where: { id_usuario: user.id_usuario, nombre: "SUPER_ADMIN" },
      defaults: { id_usuario: user.id_usuario, nombre: "SUPER_ADMIN" },
      transaction: t,
    });

    await Direccion.upsert(
      {
        id_direccion: 2,
        id_colaborador: colab.id_colaborador,
        id_provincia: 1,
        id_canton: 115,
        id_distrito: 10203,
        otros_datos: "Cerro Vista Ap 4A",
        es_principal: 1,
      },
      { transaction: t },
    );

    const [contrato] = await Contrato.findOrCreate({
      where: { id_contrato: 5 },
      defaults: {
        id_contrato: 5,
        id_colaborador: colab.id_colaborador,
        id_puesto: 2,
        fecha_inicio: "2026-01-04",
        id_tipo_contrato: 1,
        id_tipo_jornada: 1,
        horas_semanales: "40.00",
        salario_base: "3000000.00",
        id_ciclo_pago: 1,
        estado: estadoActivo.id_estado,
      },
      transaction: t,
    });

    await contrato.update(
      {
        id_colaborador: colab.id_colaborador,
        id_puesto: 2,
        fecha_inicio: "2026-01-04",
        id_tipo_contrato: 1,
        id_tipo_jornada: 1,
        horas_semanales: "40.00",
        salario_base: "3000000.00",
        id_ciclo_pago: 1,
        estado: estadoActivo.id_estado,
      },
      { transaction: t },
    );

    await HorarioLaboral.upsert(
      {
        id_horario: 2,
        id_contrato: contrato.id_contrato,
        hora_inicio: "08:00:00",
        hora_fin: "17:00:00",
        minutos_descanso: 60,
        dias_laborales: "LKMJV",
        dias_libres: "SD",
        estado: estadoActivo.id_estado,
        fecha_actualizacion: "2026-01-04",
        id_tipo_jornada: 1,
      },
      { transaction: t },
    );

    await t.commit();
    console.log("[seed] Super admin OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error super admin:", err);
    throw err;
  }
}
