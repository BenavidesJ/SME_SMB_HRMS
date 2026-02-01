import { DataTypes } from "sequelize";

export function Deduccion(sequelize) {
  return sequelize.define(
    "deduccion",
    {
      id_deduccion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING(45),
        allowNull: false,
      },
      valor: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      es_voluntaria: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: "deduccion",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_deduccion" }],
        },
      ],
    }
  );
}