import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const EvaluacionRubro = sequelize.define(
  "evaluacion_rubro",
  {
    id_evaluacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    id_rubro_evaluacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: "evaluacion_rubro",
    timestamps: false,
  }
);

