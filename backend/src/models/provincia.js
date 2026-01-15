import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Provincia = sequelize.define(
  "provincia",
  {
    id_provincia: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
  },
  {
    tableName: "provincia",
    timestamps: false,
  }
);
