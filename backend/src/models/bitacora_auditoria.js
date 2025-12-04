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
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    accion: {
      type: DataTypes.STRING(40),
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
    registro_afectado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ip_origen: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    datos_anteriores: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    datos_nuevos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "bitacora_auditoria",
    timestamps: false,
    indexes: [{ fields: ["actor_id"] }],
  }
);
