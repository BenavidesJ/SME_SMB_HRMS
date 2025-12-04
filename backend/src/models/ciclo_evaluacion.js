import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const CicloEvaluacion = sequelize.define(
  "ciclo_evaluacion",
  {
    id_ciclo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "ciclo_evaluacion",
    timestamps: false,
  }
);
