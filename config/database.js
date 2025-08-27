const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Eventos de conexión
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 Error de conexión de Mongoose:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose desconectado de MongoDB');
    });

    // Manejo de señales de terminación
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB desconectado debido a terminación de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
