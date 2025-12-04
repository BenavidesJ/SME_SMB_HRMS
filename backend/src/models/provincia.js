import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Provincia = sequelize.define(
  "provincia",
  {
    id_provincia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "provincia",
    timestamps: false,
    indexes: [{ unique: true, fields: ["nombre"] }],
  }
);
