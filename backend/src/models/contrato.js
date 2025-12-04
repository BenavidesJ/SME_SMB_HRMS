import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Contrato = sequelize.define(
  "contrato",
  {
    id_contrato: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_puesto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null,
    },
    id_tipo_contrato: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_tipo_jornada: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    horas_semanales: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    salario_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    ciclo_pago: {
      type: DataTypes.ENUM("SEMANAL", "QUINCENAL", "MENSUAL"),
      allowNull: false,
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
    url_documento: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "contrato",
    timestamps: false,
    indexes: [
      { fields: ["id_puesto"] },
      { fields: ["id_colaborador", "fecha_inicio"] },
      { unique: true, fields: ["id_contrato"] },
      { fields: ["id_tipo_jornada"] },
      { fields: ["id_tipo_contrato"] },
    ],
  }
);
