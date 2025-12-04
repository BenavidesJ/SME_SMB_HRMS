import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const SolicitudPermisosLicencias = sequelize.define(
  "solicitud_permisos_licencias",
  {
    id_permiso: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
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
    cantidad_dias: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    horas_por_dia: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("PENDIENTE", "APROBADO", "RECHAZADO", "ANULADO"),
      allowNull: false,
      defaultValue: "PENDIENTE",
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    es_remunerado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  {
    tableName: "solicitud_permisos_licencias",
    timestamps: false,
    indexes: [
      { fields: ["id_colaborador"] },
      { fields: ["aprobado_por"] },
    ],
  }
);
