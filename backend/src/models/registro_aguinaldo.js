import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const RegistroAguinaldo = sequelize.define(
  "registro_aguinaldo",
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
    ano: {
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
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "registro_aguinaldo",
    timestamps: false,
    indexes: [
      { unique: true, fields: ["id_colaborador", "ano"] },
      { fields: ["aprobado_por"] },
    ],
  }
);
