import { DataTypes } from "sequelize";

export function JornadaDiaria(sequelize) {
  return sequelize.define(
    "jornada_diaria",
    {
      id_jornada: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      horas_ordinarias: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      horas_extra: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      horas_nocturnas: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      feriado: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "feriado", key: "id_feriado" },
      },
      incapacidad: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "incapacidad", key: "id_incapacidad" },
      },
      vacaciones: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "solicitud_vacaciones", key: "id_solicitud_vacaciones" },
      },
      permiso: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "solicitud_permisos", key: "id_solicitud" },
      },
    },
    {
      tableName: "jornada_diaria",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_jornada"] },
        { name: "idx_jornada_colaborador_fecha", using: "BTREE", fields: ["id_colaborador", "fecha"] },
        { name: "idx_jornada_feriado", using: "BTREE", fields: ["feriado"] },
        { name: "idx_jornada_incapacidad", using: "BTREE", fields: ["incapacidad"] },
        { name: "idx_jornada_vacaciones", using: "BTREE", fields: ["vacaciones"] },
        { name: "idx_jornada_permiso", using: "BTREE", fields: ["permiso"] },
      ],
    }
  );
}