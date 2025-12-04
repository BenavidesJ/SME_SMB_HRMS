import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const JornadaDiaria = sequelize.define(
  "jornada_diaria",
  {
    id_jornada: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    horas_trabajadas: {
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
    feriado_obligatorio: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "jornada_diaria",
    timestamps: false,
    indexes: [
      { fields: ["id_colaborador", "fecha"] },
    ],
  }
);
