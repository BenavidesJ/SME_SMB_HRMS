import { DataTypes } from "sequelize";

export function Feriado(sequelize) {
  return sequelize.define(
    "feriado",
    {
      id_feriado: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      es_obligatorio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: "feriado",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_feriado"] },
      ],
    }
  );
}