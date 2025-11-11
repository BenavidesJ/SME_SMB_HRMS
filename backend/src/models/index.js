import { Colaborador } from './colaborador.js';
import { Usuario } from './usuario.js';
import { Rol } from './rol.js';
import { UsuarioRol } from './usuario_rol.js';

// =========== 1:N / 1:1 ===========

Colaborador.hasOne(Usuario, {
  foreignKey: 'id_colaborador',
  as: "usuario",
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Usuario.belongsTo(Colaborador, {
  foreignKey: 'id_colaborador',
  as: "colaborador",
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// =========== N:M ===========

Usuario.belongsToMany(Rol, {
  through: UsuarioRol,
  foreignKey: 'id_usuario',
  otherKey: 'id_rol',
  as: "roles",
  timestamps: false,
});
Rol.belongsToMany(Usuario, {
  through: UsuarioRol,
  foreignKey: 'id_rol',
  otherKey: 'id_usuario',
  timestamps: false,
});

export {
  Colaborador,
  Usuario,
  Rol,
  UsuarioRol,
};
