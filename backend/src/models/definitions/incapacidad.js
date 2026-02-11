import { DataTypes } from "sequelize";

export function Incapacidad(sequelize) {
  return sequelize.define(
    "incapacidad",
    {
      id_incapacidad: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      id_tipo_incap: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipo_incapacidad", key: "id_tipo_incap" },
      },
      porcentaje_patrono: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      porcentaje_ccss: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      grupo: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "incapacidad",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_incapacidad"] },
        { name: "idx_incapacidad_tipo", using: "BTREE", fields: ["id_tipo_incap"] },
        { name: "idx_incapacidad_grupo", using: "BTREE", fields: ["grupo"] },
      ],
    }
  );
}