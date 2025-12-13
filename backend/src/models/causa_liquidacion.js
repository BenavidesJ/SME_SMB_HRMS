import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const CausaLiquidacion = sequelize.define(
  "causa_liquidacion",
  {
    id_causa_liquidacion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    causa_liquidacion: {
      type: DataTypes.STRING(35),
      allowNull: false,
    },
  },
  {
    tableName: "causa_liquidacion",
    timestamps: false,
  }
);
