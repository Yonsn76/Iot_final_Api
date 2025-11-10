/**
 * Script para eliminar el índice problemático 'id_1' de la colección de notificaciones
 * 
 * Este script resuelve el error:
 * E11000 duplicate key error collection: iot_sensors.notifications index: id_1 dup key: { id: null }
 * 
 * Ejecutar con: node scripts/removeIdIndex.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function removeIdIndex() {
  try {
    // Conectar a MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://yonsn:1234@cluster0.7imrsfw.mongodb.net/iot_sensors?retryWrites=true&w=majority";
    
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado');
    
    const db = mongoose.connection.db;
    const collection = db.collection('notifications');
    
    // Listar todos los índices actuales
    console.log('\n📋 Índices actuales en la colección "notifications":');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    // Verificar si existe el índice problemático
    const idIndex = indexes.find(idx => idx.name === 'id_1');
    
    if (idIndex) {
      console.log('\n⚠️  Índice problemático "id_1" encontrado. Eliminándolo...');
      try {
        await collection.dropIndex('id_1');
        console.log('✅ Índice "id_1" eliminado exitosamente.');
      } catch (dropError) {
        if (dropError.code === 27 || dropError.message.includes('index not found')) {
          console.log('ℹ️  El índice "id_1" ya no existe (puede haber sido eliminado previamente).');
        } else {
          throw dropError;
        }
      }
    } else {
      console.log('\n✅ El índice "id_1" no existe. No hay acción necesaria.');
    }
    
    // Verificar también si hay documentos con el campo 'id' definido
    console.log('\n🔍 Verificando documentos con campo "id" definido...');
    const docsWithId = await collection.countDocuments({ id: { $exists: true, $ne: null } });
    if (docsWithId > 0) {
      console.log(`⚠️  Se encontraron ${docsWithId} documentos con el campo "id" definido.`);
      console.log('   Estos documentos pueden causar problemas.');
      console.log('   Para eliminarlo manualmente, ejecuta en MongoDB:');
      console.log('   db.notifications.updateMany({}, { $unset: { id: "" } })');
    } else {
      console.log('✅ No se encontraron documentos con el campo "id" definido.');
    }
    
    // Listar índices después de la operación
    console.log('\n📋 Índices finales en la colección "notifications":');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });
    
    console.log('\n✅ Script completado exitosamente.');
    
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error);
    console.error('Detalles:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada.');
    process.exit(0);
  }
}

// Ejecutar el script
removeIdIndex();

