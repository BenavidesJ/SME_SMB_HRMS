import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const TipoSolicitud = sequelize.define(
  "tipo_solicitud",
  {
    id_tipo_solicitud: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_solicitud: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    es_licencia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    es_permiso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "tipo_solicitud",
    timestamps: false,
  }
);
