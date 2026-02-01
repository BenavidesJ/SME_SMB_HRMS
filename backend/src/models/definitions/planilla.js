import { DataTypes } from "sequelize";

export function Planilla(sequelize) {
  return sequelize.define(
    "planilla",
    {
      id_detalle: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      id_periodo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "periodo_planilla", key: "id_periodo" },
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      id_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "contrato", key: "id_contrato" },
      },
      horas_ordinarias: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      horas_extra: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      horas_feriado: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      horas_nocturnas: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      bruto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      deducciones: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      neto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    },
    {
      tableName: "planilla",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_detalle"] },
        { name: "idx_planilla_periodo_colaborador", using: "BTREE", fields: ["id_periodo", "id_colaborador"] },
        { name: "idx_planilla_colaborador", using: "BTREE", fields: ["id_colaborador"] },
        { name: "idx_planilla_contrato", using: "BTREE", fields: ["id_contrato"] },
      ],
    }
  );
}