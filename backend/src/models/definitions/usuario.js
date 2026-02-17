import { DataTypes } from "sequelize";

export function Usuario(sequelize) {
  return sequelize.define(
    "usuario",
    {
      id_usuario: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: "uq_usuario_username",
      },
      contrasena_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Contraseña encriptada.",
      },
      requiere_cambio_contrasena: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      id_colaborador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "colaborador", key: "id_colaborador" },
      },
      id_rol: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "rol",
        references: { model: "rol", key: "id_rol" },
      },
      estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "estado", key: "id_estado" },
      },
    },
    {
      tableName: "usuario",
      timestamps: false,
      indexes: [
        { name: "PRIMARY", unique: true, using: "BTREE", fields: ["id_usuario"] },
        { name: "uq_usuario_username", unique: true, using: "BTREE", fields: ["username"] },
        { name: "idx_usuario_colaborador", using: "BTREE", fields: ["id_colaborador"] },
        { name: "idx_usuario_rol", using: "BTREE", fields: ["rol"] },
        { name: "idx_usuario_estado", using: "BTREE", fields: ["estado"] },
      ],
    }
  );
}