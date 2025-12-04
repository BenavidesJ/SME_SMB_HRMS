import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const CasoTerminacion = sequelize.define(
  "caso_terminacion",
  {
    id_caso_termina: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_colaborador: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    causa: {
      type: DataTypes.ENUM(
        "RENUNCIA",
        "DESPIDO_CON_CAUSA",
        "DESPIDO_CON_RESPONSABILIDAD",
        "ACUERDO_MUTUO"
      ),
      allowNull: false,
    },
    se_otorgo_preaviso: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fecha_terminacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    promedio_base: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    dias_vac_pend: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    aguinaldo_prop: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    monto_cesantia: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    monto_preaviso: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    otros_montos: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    total_liquidacion: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_aprobacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    tableName: "caso_terminacion",
    timestamps: false,
    indexes: [
      { fields: ["id_colaborador", "fecha_terminacion"] },
      { fields: ["aprobado_por"] },
    ],
  }
);
