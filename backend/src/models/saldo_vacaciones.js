import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const SaldoVacaciones = sequelize.define(
  "saldo_vacaciones",
  {
    id_saldo_vac: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dias_ganados: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    dias_tomados: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "saldo_vacaciones",
    timestamps: false,
  }
);
