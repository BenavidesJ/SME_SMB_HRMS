import { DataTypes } from "sequelize";

export function SolicitudVacaciones(sequelize) {
  return sequelize.define(
    "solicitud_vacaciones",
    {
      id_solicitud_vacaciones: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      id_aprobador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      estado_solicitud: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
      fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
      id_saldo_vacaciones: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "saldo_vacaciones", key: "id_saldo_vac" },
      },
    },
    {
      tableName: "solicitud_vacaciones",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_solicitud_vacaciones"] },
        { name: "idx_sol_vac_saldo", using: "BTREE", fields: ["id_saldo_vacaciones"] },
        { name: "idx_sol_vac_colaborador", using: "BTREE", fields: ["id_colaborador"] },
        { name: "idx_sol_vac_aprobador", using: "BTREE", fields: ["id_aprobador"] },
        { name: "idx_sol_vac_estado", using: "BTREE", fields: ["estado_solicitud"] },
      ],
    }
  );
}