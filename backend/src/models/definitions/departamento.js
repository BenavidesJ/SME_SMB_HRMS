import { DataTypes } from "sequelize";

export function Departamento(sequelize) {
  return sequelize.define(
    "departamento",
    {
      id_departamento: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        comment: "Identificador único del registro.",
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: "Nombre oficial del departamento",
      },
    },
    {
      tableName: "departamento",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_departamento" }],
        },
      ],
    }
  );
}