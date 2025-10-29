import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Correo = sequelize.define("correo", {
  id_correo: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  actualizado_en: { type: DataTypes.DATE },
}, {
  tableName: "correo",
  timestamps: false,
});
