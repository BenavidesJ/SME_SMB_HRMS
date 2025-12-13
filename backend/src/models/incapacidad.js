import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Incapacidad = sequelize.define(
  "incapacidad",
  {
    id_incapacidad: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_tipo_incap: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    porcentaje_patrono: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    porcentaje_ccss: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "N/A",
    },
  },
  {
    tableName: "incapacidad",
    timestamps: false,
  }
);
