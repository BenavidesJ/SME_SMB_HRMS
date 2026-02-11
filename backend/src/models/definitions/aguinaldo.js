import { DataTypes } from "sequelize";

export function Aguinaldo(sequelize) {
  return sequelize.define(
    "aguinaldo",
    {
      id_aguinaldo: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      anio: { type: DataTypes.INTEGER, allowNull: false },
      periodo_desde: { type: DataTypes.DATEONLY, allowNull: false },
      periodo_hasta: { type: DataTypes.DATEONLY, allowNull: false },
      monto_calculado: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      fecha_pago: { type: DataTypes.DATEONLY, allowNull: false },
      registrado_por: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
    },
    {
      tableName: "aguinaldo",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_aguinaldo"] },
        { name: "uq_aguinaldo_colaborador_anio", unique: true, using: "BTREE", fields: ["id_colaborador", "anio"] },
        { name: "idx_aguinaldo_registrado_por", using: "BTREE", fields: ["registrado_por"] },
      ],
    }
  );
}