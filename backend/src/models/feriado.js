import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Feriado = sequelize.define(
  "dia_feriado",
  {
    id_feriado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false, unique: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false },
    es_obligatorio: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: "dia_feriado", timestamps: false }
);
