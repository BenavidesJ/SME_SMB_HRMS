import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const PeriodoPlanilla = sequelize.define(
  "periodo_planilla",
  {
    id_periodo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    ciclo: {
      type: DataTypes.ENUM("SEMANAL", "QUINCENAL", "MENSUAL"),
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM("ABIERTO", "CALCULADO", "APROBADO", "PAGADO"),
      allowNull: false,
      defaultValue: "ABIERTO",
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "N/A",
    },
  },
  {
    tableName: "periodo_planilla",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["fecha_inicio", "fecha_fin"] },
    ],
  }
);
