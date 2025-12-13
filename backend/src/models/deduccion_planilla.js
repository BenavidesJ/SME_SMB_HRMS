import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const DeduccionPlanilla = sequelize.define(
  "deduccion_planilla",
  {
    id_deduccion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_detalle: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    valor_monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    valor_porcentaje: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    id_tipo_deduccion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "deduccion_planilla",
    timestamps: false,
  }
);
