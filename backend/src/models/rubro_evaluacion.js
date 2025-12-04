import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const RubroEvaluacion = sequelize.define(
  "rubro_evaluacion",
  {
    id_rubro_evaluacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rubro: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    calificacion: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "rubro_evaluacion",
    timestamps: false,
  }
);
