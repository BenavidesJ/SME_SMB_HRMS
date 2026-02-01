import { DataTypes } from "sequelize";

export function CicloPago(sequelize) {
  return sequelize.define(
    "ciclo_pago",
    {
      id_ciclo_pago: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      ciclo_pago: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
    },
    {
      tableName: "ciclo_pago",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_ciclo_pago"] },
      ],
    }
  );
}