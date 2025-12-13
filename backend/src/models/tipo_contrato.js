import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoContrato = sequelize.define(
  "tipo_contrato",
  {
    id_tipo_contrato: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_contrato: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
  },
  {
    tableName: "tipo_contrato",
    timestamps: false,
  }
);
