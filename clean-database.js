const mongoose = require('mongoose');

// Conectar a MongoDB
const MONGODB_URI = "mongodb+srv://yonsn:1234@cluster0.7imrsfw.mongodb.net/iot_sensors?retryWrites=true&w=majority";

async function cleanDatabase() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener la colección
    const db = mongoose.connection.db;
    const collection = db.collection('sensordatas');

    // Eliminar todos los documentos
    console.log('🗑️ Eliminando documentos existentes...');
    const deleteResult = await collection.deleteMany({});
    console.log(`✅ Eliminados ${deleteResult.deletedCount} documentos`);

    // Eliminar índices problemáticos
    console.log('🔧 Eliminando índices problemáticos...');
    try {
      await collection.dropIndexes();
      console.log('✅ Índices eliminados');
    } catch (error) {
      console.log('ℹ️ No hay índices para eliminar');
    }

    // Crear nuevo índice _id
    console.log('🔧 Creando nuevo índice _id...');
    await collection.createIndex({ "_id": 1 }, { unique: true });
    console.log('✅ Índice _id creado');

    console.log('🎉 Base de datos limpiada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

cleanDatabase();




