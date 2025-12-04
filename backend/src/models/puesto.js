import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Puesto = sequelize.define(
  "puesto",
  {
    id_puesto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_departamento: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    sal_base_referencia_min: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    sal_base_referencia_max: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    tableName: "puesto",
    timestamps: false,
    indexes: [
      { fields: ["id_departamento", "nombre"] },
      { unique: true, fields: ["nombre"] },
    ],
  }
);
