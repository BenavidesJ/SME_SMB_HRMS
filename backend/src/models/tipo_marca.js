import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoMarca = sequelize.define(
  "tipo_marca",
  {
    id_tipo_marca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: "tipo_marca",
    timestamps: false,
  }
);
