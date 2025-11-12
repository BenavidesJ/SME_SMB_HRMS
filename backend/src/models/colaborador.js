import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const Colaborador = sequelize.define(
  "colaborador",
  {
    id_colaborador: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    primer_apellido: { type: DataTypes.STRING(150), allowNull: false },
    segundo_apellido: { type: DataTypes.STRING(150), allowNull: false },
    nacionalidad: { type: DataTypes.STRING(50), allowNull: false },
    genero: {
      type: DataTypes.ENUM("MASCULINO", "FEMENINO", "OTRO"),
      allowNull: false,
    },
    identificacion: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    fecha_nacimiento: { type: DataTypes.DATEONLY, allowNull: false },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { isEmail: true },
    },
    fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: false },
    estado: {
      type: DataTypes.ENUM("ACTIVO", "SUSPENDIDO", "DESVINCULADO"),
      allowNull: false,
      defaultValue: "ACTIVO",
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "colaborador",
    timestamps: false,
    indexes: [{ unique: true, fields: ["identificacion"] }],
  }
);
