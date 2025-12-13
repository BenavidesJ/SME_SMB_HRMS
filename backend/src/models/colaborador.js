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
    nombre: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    primer_apellido: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    segundo_apellido: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_genero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    identificacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    fecha_ingreso: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    cantidad_hijos: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    estado_civil: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "colaborador",
    timestamps: false,
  }
);
