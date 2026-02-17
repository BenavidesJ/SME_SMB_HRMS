import { DataTypes } from "sequelize";

export function Direccion(sequelize) {
  return sequelize.define(
    "direccion",
    {
      id_direccion: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
        comment: "Identificador único del registro.",
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Colaborador al que pertenece la dirección.",
        references: { model: "colaborador", key: "id_colaborador" },
      },
      id_provincia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Provincia correspondiente a la dirección.",
        references: { model: "provincia", key: "id_provincia" },
      },
      id_canton: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Cantón correspondiente a la dirección.",
        references: { model: "canton", key: "id_canton" },
      },
      id_distrito: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "Distrito correspondiente a la dirección.",
        references: { model: "distrito", key: "id_distrito" },
      },
      otros_datos: {
        type: DataTypes.STRING(300),
        allowNull: false,
        comment: "Descripción adicional del domicilio.",
      },
      es_principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
        comment: "Indicador lógico de dirección principal.",
      },
    },
    {
      tableName: "direccion",
      timestamps: false,
      indexes: [
        {
          name: "PRIMARY",
          unique: true,
          using: "BTREE",
          fields: [{ name: "id_direccion" }],
        },
        {
          name: "idx_direccion_colaborador",
          using: "BTREE",
          fields: [
            { name: "id_colaborador" },
            { name: "es_principal" },
          ],
        },
        {
          name: "idx_direccion_provincia",
          using: "BTREE",
          fields: [{ name: "id_provincia" }],
        },
        {
          name: "idx_direccion_canton",
          using: "BTREE",
          fields: [{ name: "id_canton" }],
        },
        {
          name: "idx_direccion_distrito",
          using: "BTREE",
          fields: [{ name: "id_distrito" }],
        },
      ],
    }
  );
}