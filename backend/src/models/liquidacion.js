import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Liquidacion = sequelize.define(
  "liquidacion",
  {
    id_caso_termina: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    causa: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    realizo_preaviso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_terminacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    promedio_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    aguinaldo_proporcional: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    monto_cesantia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    monto_preaviso: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    otros_montos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    id_aprobador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_aprobacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    saldo_vacaciones: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "liquidacion",
    timestamps: false,
  }
);
