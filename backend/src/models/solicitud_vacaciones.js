import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const SolicitudVacaciones = sequelize.define(
  "solicitud_vacaciones",
  {
    id_solicitud_vacaciones: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_aprobador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado_solicitud: {
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
    id_saldo_vacaciones: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "solicitud_vacaciones",
    timestamps: false,
  }
);
