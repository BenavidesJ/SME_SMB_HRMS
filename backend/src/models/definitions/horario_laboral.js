import { DataTypes } from "sequelize";

export function HorarioLaboral(sequelize) {
  return sequelize.define(
    "horario_laboral",
    {
      id_horario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      id_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "contrato", key: "id_contrato" },
      },
      hora_inicio: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      dias_laborales: {
        type: DataTypes.STRING(12),
        allowNull: false,
        defaultValue: "LKMJV",
      },
      dias_libres: {
        type: DataTypes.STRING(12),
        allowNull: false,
        defaultValue: "SD",
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
      fecha_actualizacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      id_tipo_jornada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipo_jornada", key: "id_tipo_jornada" },
      },
    },
    {
      tableName: "horario_laboral",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_horario"] },
        { name: "idx_horario_contrato", using: "BTREE", fields: ["id_contrato"] },
        { name: "idx_horario_tipo_jornada", using: "BTREE", fields: ["id_tipo_jornada"] },
        { name: "idx_horario_estado", using: "BTREE", fields: ["estado"] },
      ],
    }
  );
}