import { DataTypes } from "sequelize";

export function Provincia(sequelize) {
  return sequelize.define(
    "provincia",
    {
      id_provincia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: "uq_provincia_nombre",
      },
    },
    {
      tableName: "provincia",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_provincia"] },
        { name: "uq_provincia_nombre", unique: true, using: "BTREE", fields: ["nombre"] },
      ],
    }
  );
}