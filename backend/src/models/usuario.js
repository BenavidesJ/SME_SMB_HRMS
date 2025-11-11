import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    contrasena_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ultimo_acceso_en: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    creado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "colaborador",
        key: "id_colaborador",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "usuario",
    schema: "tfg_dev",
    timestamps: false,
    indexes: [{ unique: true, fields: ["username"] }],
  }
);
