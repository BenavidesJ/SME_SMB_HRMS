import { DataTypes } from "sequelize";

export function BitacoraAuditoria(sequelize) {
  return sequelize.define(
    "bitacora_auditoria",
    {
      id_bitacora: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      entidad_afectada: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      evento: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      actor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "usuario", key: "id_usuario" },
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      id_registro_afectado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "bitacora_auditoria",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_bitacora"] },
        { name: "idx_bitacora_actor", using: "BTREE", fields: ["actor_id"] },
      ],
    }
  );
}