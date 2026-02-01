import { DataTypes } from "sequelize";

export function MarcaAsistencia(sequelize) {
  return sequelize.define(
    "marca_asistencia",
    {
      id_marca: { type: DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey: true },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      id_tipo_marca: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipo_marca", key: "id_tipo_marca" },
      },
      timestamp: { type: DataTypes.DATE, allowNull: false },
    },
    {
      tableName: "marca_asistencia",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_marca"] },
        { name: "idx_marca_tipo", using: "BTREE", fields: ["id_tipo_marca"] },
        { name: "idx_marca_colaborador_timestamp", using: "BTREE", fields: ["id_colaborador", "timestamp"] },
      ],
    }
  );
}