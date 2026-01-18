import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const SolicitudPermisosLicencias = sequelize.define(
  "solicitud_permisos_licencias",
  {
    id_solicitud: {
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
    tipo_solicitud: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    con_goce_salarial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cantidad_horas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    cantidad_dias: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "solicitud_permisos_licencias",
    timestamps: false,
  }
);
