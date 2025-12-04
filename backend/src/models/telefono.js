import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Telefono = sequelize.define(
  "telefono",
  {
    id_telefono: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("MOVIL", "FIJO", "OTRO"),
      allowNull: false,
      defaultValue: "MOVIL",
    },
    numero: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    es_principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "telefono",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_colaborador", "numero"] },
    ],
  }
);
