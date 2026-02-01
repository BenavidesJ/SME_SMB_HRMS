import { DataTypes } from "sequelize";

export function EvaluacionRubro(sequelize) {
  return sequelize.define(
    "evaluacion_rubro",
    {
      id_evaluacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "evaluacion", key: "id_evaluacion" },
      },
      id_rubro_evaluacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "rubro_evaluacion", key: "id_rubro_evaluacion" },
      },
    },
    {
      tableName: "evaluacion_rubro",
      timestamps: false,
      indexes: [
        { name: "idx_evaluacion_rubro_eval", using: "BTREE", fields: ["id_evaluacion"] },
        { name: "idx_evaluacion_rubro_rubro", using: "BTREE", fields: ["id_rubro_evaluacion"] },
      ],
    }
  );
}