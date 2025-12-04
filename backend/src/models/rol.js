import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Rol = sequelize.define("rol", {
  id_rol: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(60), allowNull: false, unique: true },
}, {
  tableName: "rol",
  timestamps: false,
  indexes: [{ unique: true, fields: ["nombre"] }],
});
