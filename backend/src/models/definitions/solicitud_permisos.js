import { DataTypes } from "sequelize";

export function SolicitudPermisos(sequelize) {
  return sequelize.define(
    "solicitud_permisos",
    {
      id_solicitud: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
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
      con_goce_salarial: { type: DataTypes.BOOLEAN, allowNull: false },
      cantidad_horas: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
      cantidad_dias: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0.0 },
    },
    {
      tableName: "solicitud_permisos",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_solicitud"] },
        { name: "idx_sol_perm_colaborador", using: "BTREE", fields: ["id_colaborador"] },
        { name: "idx_sol_perm_aprobador", using: "BTREE", fields: ["id_aprobador"] },
        { name: "idx_sol_perm_estado", using: "BTREE", fields: ["estado_solicitud"] },
      ],
    }
  );
}