import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Aguinaldo = sequelize.define(
  "aguinaldo",
  {
    id_aguinaldo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    periodo_desde: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    periodo_hasta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    monto_calculado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    fecha_pago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    registrado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "aguinaldo",
    timestamps: false,
  }
);
