import { DataTypes } from "sequelize";

export function DeduccionPlanilla(sequelize) {
  const model = sequelize.define(
    "deduccion_planilla",
    {
      id_planilla: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "planilla", key: "id_detalle" },
      },
      id_deduccion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "deduccion", key: "id_deduccion" },
      },
    },
    {
      tableName: "deduccion_planilla",
      timestamps: false,
      indexes: [
        {
          name: "idx_deduccion_planilla_planilla",
          using: "BTREE",
          fields: [{ name: "id_planilla" }],
        },
        {
          name: "idx_deduccion_planilla_deduccion",
          using: "BTREE",
          fields: [{ name: "id_deduccion" }],
        },
      ],
    }
  );
  model.removeAttribute("id");
  return model;
}