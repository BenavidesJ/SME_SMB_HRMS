import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoJornada = sequelize.define(
  "tipo_jornada",
  {
    id_tipo_jornada: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    max_horas_diarias: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
    },
    max_horas_semanales: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
  },
  {
    tableName: "tipo_jornada",
    timestamps: false,
  }
);
