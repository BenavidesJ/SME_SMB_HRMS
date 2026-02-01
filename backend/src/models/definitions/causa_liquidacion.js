import { DataTypes } from "sequelize";

export function CausaLiquidacion(sequelize) {
  return sequelize.define(
    "causa_liquidacion",
    {
      id_causa_liquidacion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      causa_liquidacion: {
        type: DataTypes.STRING(35),
        allowNull: false,
      },
    },
    {
      tableName: "causa_liquidacion",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_causa_liquidacion"] },
      ],
    }
  );
}