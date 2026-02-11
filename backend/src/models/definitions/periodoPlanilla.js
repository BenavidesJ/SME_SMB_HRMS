import { DataTypes } from "sequelize";

export function PeriodoPlanilla(sequelize) {
  return sequelize.define(
    "periodo_planilla",
    {
      id_periodo: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_pago: { type: DataTypes.DATEONLY, allowNull: false },
      ciclo_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "ciclo_pago", key: "id_ciclo_pago" },
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
    },
    {
      tableName: "periodo_planilla",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_periodo"] },
        { name: "uq_periodo_planilla_rango", unique: true, using: "BTREE", fields: ["fecha_inicio", "fecha_fin"] },
        { name: "idx_periodo_planilla_estado", using: "BTREE", fields: ["estado"] },
        { name: "idx_periodo_planilla_ciclo_pago", using: "BTREE", fields: ["ciclo_pago"] },
      ],
    }
  );
}