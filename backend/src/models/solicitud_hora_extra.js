import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const SolicitudHoraExtra = sequelize.define(
  "solicitud_hora_extra",
  {
    id_solicitud_hx: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_solicitud: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_trabajo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    horas_solicitadas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    id_tipo_hx: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("PENDIENTE", "APROBADA", "RECHAZADA"),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    horas_aprobadas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
  },
  {
    tableName: "solicitud_hora_extra",
    timestamps: false,
  }
);
