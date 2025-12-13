import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const BitacoraAuditoria = sequelize.define(
  "bitacora_auditoria",
  {
    id_bitacora: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    entidad_afectada: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    evento: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    actor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    id_registro_afectado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ip_origen: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
  },
  {
    tableName: "bitacora_auditoria",
    timestamps: false,
  }
);
