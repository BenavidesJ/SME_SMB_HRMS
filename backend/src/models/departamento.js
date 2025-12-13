import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Departamento = sequelize.define(
  "departamento",
  {
    id_departamento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "departamento",
    timestamps: false,
  }
);
