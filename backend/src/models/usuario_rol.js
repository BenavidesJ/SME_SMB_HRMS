import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Usuario_Rol = sequelize.define("usuario_rol", {
  id_usuario: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
  id_rol: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true },
}, {
  tableName: "usuario_rol",
  timestamps: false,
});
