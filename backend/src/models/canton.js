import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Canton = sequelize.define(
  "canton",
  {
    id_canton: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: { model: "canton", key: "id_canton" },
    },
    id_provincia: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
  },
  {
    tableName: "canton",
    timestamps: false,
  }
);
