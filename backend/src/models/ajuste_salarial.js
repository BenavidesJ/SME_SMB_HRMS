import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const AjusteSalarial = sequelize.define(
  "ajuste_salarial",
  {
    id_ajuste: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_contrato: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_vigencia: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    salario_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "N/A",
    },
  },
  {
    tableName: "ajuste_salarial",
    timestamps: false,
  }
);
