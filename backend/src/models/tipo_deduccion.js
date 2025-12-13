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
    nombre_tipo: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    es_procentaje: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    es_monto: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    es_voluntaria: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    fecha_ultimo_ajuste: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "tipo_deduccion",
    timestamps: false,
  }
);
