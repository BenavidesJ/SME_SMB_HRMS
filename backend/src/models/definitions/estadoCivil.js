import { DataTypes } from "sequelize";

export function EstadoCivil(sequelize) {
  return sequelize.define("estado_civil", {
    id_estado_civil: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    estado_civil: { type: DataTypes.STRING(15), allowNull: false },
  }, { tableName: "estado_civil", timestamps: false });
}