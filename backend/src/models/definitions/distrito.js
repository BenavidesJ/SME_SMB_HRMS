import { DataTypes } from "sequelize";

export function Distrito(sequelize) {
  return sequelize.define(
    "distrito",
    {
      id_distrito: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      id_canton: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "canton", key: "id_canton" },
      },
      nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
    },
    {
      tableName: "distrito",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_distrito" }],
        },
        {
          name: "uq_distrito_canton_nombre",
          unique: true,
          using: "BTREE",
          fields: [
            { name: "id_canton" },
            { name: "nombre" },
          ],
        },
        {
          name: "idx_distrito_canton",
          using: "BTREE",
          fields: [{ name: "id_canton" }],
        },
      ],
    }
  );
}