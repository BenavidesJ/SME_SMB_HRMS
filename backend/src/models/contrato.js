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
    id_ciclo_pago: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "contrato",
    timestamps: false,
  }
);
