import { DataTypes } from "sequelize";

export function Colaborador(sequelize) {
  return sequelize.define(
    "colaborador",
    {
      id_colaborador: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        comment: "Identificador único del registro.",
      },
      nombre: {
        type: DataTypes.STRING(25),
        allowNull: false,
        comment: "Nombres del colaborador.",
      },
      primer_apellido: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Primer apellido o apellido paterno.",
      },
      segundo_apellido: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Segundo apellido o apellido materno.",
      },
      identificacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Número de cédula, DIMEX, u otro documento de identidad.",
      },
      fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        comment: "Fecha de nacimiento.",
      },
      correo_electronico: {
        type: DataTypes.STRING(150),
        allowNull: false,
        comment: "Correo electrónico personal.",
      },
      telefono: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      cantidad_hijos: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      estado_civil: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado_civil", key: "id_estado_civil" },
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
    },
    {
      tableName: "colaborador",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_colaborador" }],
        },
        {
          name: "idx_colaborador_estado",
          using: "BTREE",
          fields: [{ name: "estado" }],
        },
        {
          name: "idx_colaborador_estado_civil",
          using: "BTREE",
          fields: [{ name: "estado_civil" }],
        },
      ],
    }
  );
}