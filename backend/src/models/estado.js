import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Estado = sequelize.define(
  "estado",
  {
    id_estado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    estado: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
  },
  {
    tableName: "estado",
    timestamps: false,
  }
);
