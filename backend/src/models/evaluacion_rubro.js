import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const EvaluacionRubro = sequelize.define(
  "evaluacion_rubro",
  {
    id_evaluacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_rubro_evaluacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "evaluacion_rubro",
    timestamps: false,
    indexes: [
      { fields: ["id_evaluacion"] },
      { fields: ["id_rubro_evaluacion"] },
    ],
  }
);
