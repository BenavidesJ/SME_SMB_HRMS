import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const UsuarioRol = sequelize.define(
  "usuario_rol",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: "usuario_rol",
    timestamps: false,
  }
);
