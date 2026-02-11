import { DataTypes } from "sequelize";

export function RubroEvaluacion(sequelize) {
  return sequelize.define(
    "rubro_evaluacion",
    {
      id_rubro_evaluacion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      rubro: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      calificacion: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      comentarios: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "rubro_evaluacion",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_rubro_evaluacion"] },
      ],
    }
  );
}