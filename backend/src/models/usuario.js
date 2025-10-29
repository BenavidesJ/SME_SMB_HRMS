import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Usuario = sequelize.define("usuario", {
    id_usuario: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(100), allowNull: false },
    contrasena_hash: { type: DataTypes.STRING(255), allowNull: false },
    activo: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    req_cambio_pass: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
    ultimo_cambio_pass: { type: DataTypes.DATE },
    ultimo_acceso_en: { type: DataTypes.DATE },
    creado_en: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    actualizado_en: { type: DataTypes.DATE },
}, {
    tableName: "usuario",
    timestamps: false
});