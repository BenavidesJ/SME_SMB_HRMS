import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoHoraExtra = sequelize.define(
  "tipo_hora_extra",
  {
    id_tipo_hx: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    multiplicador: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
  },
  {
    tableName: "tipo_hora_extra",
    timestamps: false,
  }
);
