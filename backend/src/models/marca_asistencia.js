import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const MarcaAsistencia = sequelize.define(
  "marca_asistencia",
  {
    id_marca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_tipo_marca: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ip_dispositivo: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "N/A",
    },
  },
  {
    tableName: "marca_asistencia",
    timestamps: false,
  }
);
