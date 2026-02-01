import { Sequelize } from 'sequelize';

const { DB_NAME, DB_PASSW, DB_USER, DB_HOST } = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSW, {
  host: DB_HOST,
  timezone: "-06:00",
  dialect: 'mysql',
  logging: false,
});

export const db_connection = async () => {
  try {
    await sequelize.authenticate();
    // await sequelize.sync({ force: false });
    
    console.log('La conexion ha sido establecida correctamente.');
  } catch (error) {
    console.error('No se puede conectar a la base de datos, Error:', error);
  }
};