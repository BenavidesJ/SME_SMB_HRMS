import { DataTypes } from "sequelize";

export function Contrato(sequelize) {
  return sequelize.define(
    "contrato",
    {
      id_contrato: {
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
      id_puesto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "puesto", key: "id_puesto" },
      },
      fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      id_tipo_contrato: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipo_contrato", key: "id_tipo_contrato" },
      },
      id_tipo_jornada: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tipo_jornada", key: "id_tipo_jornada" },
      },
      horas_semanales: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      salario_base: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      id_jefe_directo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
    },
    {
      tableName: "contrato",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_contrato" }],
        },
        {
          name: "idx_contrato_colaborador",
          using: "BTREE",
          fields: [{ name: "id_colaborador" }],
        },
        {
          name: "idx_contrato_puesto",
          using: "BTREE",
          fields: [{ name: "id_puesto" }],
        },
        {
          name: "idx_contrato_tipo_contrato",
          using: "BTREE",
          fields: [{ name: "id_tipo_contrato" }],
        },
        {
          name: "idx_contrato_tipo_jornada",
          using: "BTREE",
          fields: [{ name: "id_tipo_jornada" }],
        },
        {
          name: "idx_contrato_jefe_directo",
          using: "BTREE",
          fields: [{ name: "id_jefe_directo" }],
        },
        {
          name: "idx_contrato_estado",
          using: "BTREE",
          fields: [{ name: "estado" }],
        },
      ],
    }
  );
}