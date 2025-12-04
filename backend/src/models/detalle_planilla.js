import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const DetallePlanilla = sequelize.define(
  "detalle_planilla",
  {
    id_detalle: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_periodo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_contrato: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    horas_ordinarias: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    horas_extra: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    horas_feriado: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    horas_nocturnas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    bruto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    deducciones: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    neto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    registrado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "detalle_planilla",
    timestamps: false,
    indexes: [
      { fields: ["id_colaborador"] },
      { fields: ["id_periodo", "id_colaborador"] },
      { fields: ["id_contrato"] },
      { fields: ["registrado_por"] },
    ],
  }
);
