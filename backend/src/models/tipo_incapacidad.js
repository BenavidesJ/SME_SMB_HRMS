import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoIncapacidad = sequelize.define(
  "tipo_incapacidad",
  {
    id_tipo_incap: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "tipo_incapacidad",
    timestamps: false,
    indexes: [{ unique: true, fields: ["nombre"] }],
  }
);
