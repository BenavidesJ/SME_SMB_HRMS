import { DataTypes } from "sequelize";

export function TipoMarca(sequelize) {
  return sequelize.define(
    "tipo_marca",
    {
      id_tipo_marca: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: "uq_tipo_marca_nombre",
      },
    },
    {
      tableName: "tipo_marca",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_tipo_marca"] },
        { name: "uq_tipo_marca_nombre", unique: true, using: "BTREE", fields: ["nombre"] },
      ],
    }
  );
}