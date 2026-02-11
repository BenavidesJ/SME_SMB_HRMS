import { DataTypes } from "sequelize";

export function TipoHoraExtra(sequelize) {
  return sequelize.define(
    "tipo_hora_extra",
    {
      id_tipo_hx: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      nombre: { type: DataTypes.STRING(30), allowNull: false, unique: "uq_tipo_hora_extra_nombre" },
      multiplicador: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    },
    {
      tableName: "tipo_hora_extra",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_tipo_hx"] },
        { name: "uq_tipo_hora_extra_nombre", unique: true, using: "BTREE", fields: ["nombre"] },
      ],
    }
  );
}