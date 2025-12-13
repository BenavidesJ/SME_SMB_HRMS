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
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    tableName: "direccion",
    timestamps: false,
  }
);
