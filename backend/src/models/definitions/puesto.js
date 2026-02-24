import { DataTypes } from "sequelize";

export function Puesto(sequelize) {
  return sequelize.define(
    "puesto",
    {
      id_puesto: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      id_departamento: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "departamento", key: "id_departamento" },
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: "uq_puesto_nombre",
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
    },
    {
      tableName: "puesto",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_puesto"] },
        { name: "uq_puesto_nombre", unique: true, using: "BTREE", fields: ["nombre"] },
        { name: "idx_puesto_estado", using: "BTREE", fields: ["estado"] },
        { name: "idx_puesto_departamento", using: "BTREE", fields: ["id_departamento"] },
      ],
    }
  );
}