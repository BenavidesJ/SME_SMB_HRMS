import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Direccion = sequelize.define(
  "direccion",
  {
    id_direccion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_provincia: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_canton: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_distrito: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    otros_datos: {
      type: DataTypes.STRING(300),
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
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "direccion",
    timestamps: false,
    indexes: [
      { fields: ["id_provincia"] },
      { fields: ["id_canton"] },
      { fields: ["id_distrito"] },
      { fields: ["id_colaborador", "es_principal"] },
    ],
  }
);
