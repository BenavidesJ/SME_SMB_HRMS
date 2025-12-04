import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const HorarioLaboral = sequelize.define(
  "horario_laboral",
  {
    id_horario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_contrato: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    minutos_descanso: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    fecha_actualizacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    id_tipo_jornada: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "horario_laboral",
    timestamps: false,
    indexes: [
      { fields: ["id_contrato"] },
      { fields: ["id_tipo_jornada"] },
    ],
  }
);
