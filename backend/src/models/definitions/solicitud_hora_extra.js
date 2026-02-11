import { DataTypes } from "sequelize";

export function SolicitudHoraExtra(sequelize) {
  return sequelize.define(
    "solicitud_hora_extra",
    {
      id_solicitud_hx: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      fecha_solicitud: { type: DataTypes.DATE, allowNull: false },
      fecha_trabajo: { type: DataTypes.DATEONLY, allowNull: false },
      horas_solicitadas: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
      id_tipo_hx: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipo_hora_extra", key: "id_tipo_hx" },
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
    },
    {
      tableName: "solicitud_hora_extra",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_solicitud_hx"] },
        { name: "idx_solicitud_hx_tipo", using: "BTREE", fields: ["id_tipo_hx"] },
        {
          name: "idx_solicitud_hx_colab_fecha_estado",
          using: "BTREE",
          fields: ["id_colaborador", "fecha_trabajo", "estado"],
        },
        { name: "idx_solicitud_hx_estado", using: "BTREE", fields: ["estado"] },
      ],
    }
  );
}