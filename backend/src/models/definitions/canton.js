import { DataTypes } from "sequelize";

export function Canton(sequelize) {
  return sequelize.define(
    "canton",
    {
      id_canton: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        comment: "Identificador único del registro.",
      },
      id_provincia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "provincia", key: "id_provincia" },
      },
      nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
    },
    {
      tableName: "canton",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_canton"] },
        { name: "uq_canton_provincia_nombre", unique: true, using: "BTREE", fields: ["id_provincia", "nombre"] },
        { name: "idx_canton_provincia", using: "BTREE", fields: ["id_provincia"] },
      ],
    }
  );
}