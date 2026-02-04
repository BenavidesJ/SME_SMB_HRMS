import { DataTypes } from "sequelize";

export function TipoContrato(sequelize) {
  return sequelize.define(
    "tipo_contrato",
    {
      id_tipo_contrato: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      tipo_contrato: { type: DataTypes.STRING(25), allowNull: false },
    },
    {
      tableName: "tipo_contrato",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_tipo_contrato"] },
      ],
    }
  );
}