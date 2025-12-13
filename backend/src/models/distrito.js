import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Distrito = sequelize.define(
  "distrito",
  {
    id_distrito: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_canton: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
  },
  {
    tableName: "distrito",
    timestamps: false,
  }
);
