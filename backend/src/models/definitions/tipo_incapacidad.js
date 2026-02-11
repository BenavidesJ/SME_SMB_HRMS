import { DataTypes } from "sequelize";

export function TipoIncapacidad(sequelize) {
  return sequelize.define(
    "tipo_incapacidad",
    {
      id_tipo_incap: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: "uq_tipo_incapacidad_nombre",
      },
    },
    {
      tableName: "tipo_incapacidad",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_tipo_incap"] },
        { name: "uq_tipo_incapacidad_nombre", unique: true, using: "BTREE", fields: ["nombre"] },
      ],
    }
  );
}