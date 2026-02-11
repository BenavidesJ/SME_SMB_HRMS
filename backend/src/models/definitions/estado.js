import { DataTypes } from "sequelize";

export function Estado(sequelize) {
  return sequelize.define(
    "estado",
    {
      id_estado: { type: DataTypes.INTEGER, primaryKey: true },
      estado: { type: DataTypes.STRING(25), allowNull: false },
    },
    { tableName: "estado", timestamps: false }
  );
}
