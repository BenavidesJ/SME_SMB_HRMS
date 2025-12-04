import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const MarcaAsistencia = sequelize.define(
  "marca_asistencia",
  {
    id_marca: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_tipo_marca: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_hora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    origen: {
      type: DataTypes.ENUM("APP", "WEB", "BIOMETRICO", "MANUAL"),
      allowNull: false,
    },
    ip_dispositivo: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    tableName: "marca_asistencia",
    timestamps: false,
    indexes: [
      { fields: ["id_tipo_marca"] },
      { fields: ["id_colaborador", "fecha_hora"] },
      { fields: ["id_colaborador", "fecha_hora"] },
    ],
  }
);
