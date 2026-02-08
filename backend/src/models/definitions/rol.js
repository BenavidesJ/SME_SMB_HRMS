import { DataTypes } from "sequelize";

export function Rol(sequelize) {
  return sequelize.define(
    "rol",
    {
      id_rol: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      nombre: { type: DataTypes.STRING(60), allowNull: false },
    },
    {
      tableName: "rol",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_rol"] },
        { name: "uq_rol_nombre", unique: true, using: "BTREE", fields: ["nombre"] },
      ],
    }
  );
}