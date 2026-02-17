import { DataTypes } from "sequelize";

export function TipoJornada(sequelize) {
  return sequelize.define(
    "tipo_jornada",
    {
      id_tipo_jornada: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      tipo: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      max_horas_diarias: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
      },
      max_horas_semanales: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
    },
    {
      tableName: "tipo_jornada",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_tipo_jornada"] },
      ],
    }
  );
}