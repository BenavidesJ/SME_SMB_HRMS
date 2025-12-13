import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const CicloPago = sequelize.define("ciclo_pago", {
  id_ciclo_pago: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
}, {
  tableName: "ciclo_pago",
  timestamps: false,
});
