import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Genero = sequelize.define(
  "genero",
  {
    id_genero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    genero: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
  },
  {
    tableName: "genero",
    timestamps: false,
  }
);
