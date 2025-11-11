import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const UsuarioRol = sequelize.define(
  "usuario_rol",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "usuario", key: "id_usuario" },
    },
    id_rol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "rol", key: "id_rol" },
    },
  },
  {
    tableName: "usuario_rol",
    schema: "tfg_dev",
    timestamps: false,
  }
);

