import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoDeduccion = sequelize.define(
  "tipo_deduccion",
  {
    id_tipo_deduccion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(75),
      allowNull: false,
    },
    base_legal: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    es_porcentaje: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    es_monto: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_ultimo_ajuste: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    es_voluntaria: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "tipo_deduccion",
    timestamps: false,
  }
);
