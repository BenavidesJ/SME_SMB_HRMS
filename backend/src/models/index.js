import { Colaborador } from './colaborador.js';
import { Usuario } from './usuario.js';
import { Rol } from './rol.js';
import { Usuario_Rol } from './usuario_rol.js';

// =========== 1:N / 1:1 ===========

Colaborador.hasOne(Usuario, {
  foreignKey: 'id_colaborador',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Usuario.belongsTo(Colaborador, {
  foreignKey: 'id_colaborador',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// =========== N:M ===========

Usuario.belongsToMany(Rol, {
  through: Usuario_Rol,
  foreignKey: 'id_usuario',
  otherKey: 'id_rol',
  as: "roles",
  timestamps: false,
});
Rol.belongsToMany(Usuario, {
  through: Usuario_Rol,
  foreignKey: 'id_rol',
  otherKey: 'id_usuario',
  timestamps: false,
});

export {
  Colaborador,
  Usuario,
  Rol,
  Usuario_Rol,
};
