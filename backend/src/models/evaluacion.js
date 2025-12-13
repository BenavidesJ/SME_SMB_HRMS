import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Evaluacion = sequelize.define(
  "evaluacion",
  {
    id_evaluacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_evaluador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    puntaje_general: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    plan_accion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    finalizada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: "evaluacion",
    timestamps: false,
  }
);
