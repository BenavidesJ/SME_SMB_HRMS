import { DataTypes } from "sequelize";

export function Evaluacion(sequelize) {
  return sequelize.define(
    "evaluacion",
    {
      id_evaluacion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      id_evaluador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      puntaje_general: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      plan_accion: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      finalizada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "evaluacion",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_evaluacion"] },
        { name: "idx_evaluacion_colaborador", using: "BTREE", fields: ["id_colaborador"] },
        { name: "idx_evaluacion_evaluador", using: "BTREE", fields: ["id_evaluador"] },
      ],
    }
  );
}