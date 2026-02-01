import { DataTypes } from "sequelize";

export function Liquidacion(sequelize) {
  return sequelize.define(
    "liquidacion",
    {
      id_caso_termina: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      causa: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "causa_liquidacion", key: "id_causa_liquidacion" },
      },
      realizo_preaviso: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      fecha_terminacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      promedio_base: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      aguinaldo_proporcional: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      monto_cesantia: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      monto_preaviso: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      otros_montos: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      id_aprobador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      fecha_aprobacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      saldo_vacaciones: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "saldo_vacaciones", key: "id_saldo_vac" },
      },
    },
    {
      tableName: "liquidacion",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_caso_termina"] },
        { name: "idx_liquidacion_colaborador_fecha", using: "BTREE", fields: ["id_colaborador", "fecha_terminacion"] },
        { name: "idx_liquidacion_aprobador", using: "BTREE", fields: ["id_aprobador"] },
        { name: "idx_liquidacion_saldo", using: "BTREE", fields: ["saldo_vacaciones"] },
        { name: "idx_liquidacion_causa", using: "BTREE", fields: ["causa"] },
      ],
    }
  );
}