import { DataTypes } from "sequelize";

export function SaldoVacaciones(sequelize) {
  return sequelize.define(
    "saldo_vacaciones",
    {
      id_saldo_vac: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      dias_ganados: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      dias_tomados: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
    },
    {
      tableName: "saldo_vacaciones",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_saldo_vac"] },
        { name: "idx_saldo_vacaciones_colaborador", using: "BTREE", fields: ["id_colaborador"] },
      ],
    }
  );
}