/**
 * Script de migración para actualizar documentos UserPreferences
 * 
 * Este script:
 * 1. Migra myNotificationIds a allNotificationIds
 * 2. Crea activeNotificationIds basado en notificaciones activas
 * 3. Elimina myNotificationIds si existe
 * 4. Actualiza documentos de Notification para que tengan el campo 'id'
 * 
 * Ejecutar con: node scripts/migrateUserPreferences.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrateUserPreferences() {
  try {
    // Conectar a MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://yonsn:1234@cluster0.7imrsfw.mongodb.net/iot_sensors?retryWrites=true&w=majority";
    
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado');
    
    const db = mongoose.connection.db;
    const userPreferencesCollection = db.collection('userpreferences');
    const notificationsCollection = db.collection('notifications');
    
    // 1. Primero, asegurar que todas las notificaciones tengan el campo 'id'
    console.log('\n📋 Paso 1: Migrando documentos Notification...');
    const notificationsWithoutId = await notificationsCollection.find({
      $or: [
        { id: { $exists: false } },
        { id: null }
      ]
    }).toArray();
    console.log(`   Encontrados ${notificationsWithoutId.length} documentos sin campo 'id'`);
    
    for (const doc of notificationsWithoutId) {
      await notificationsCollection.updateOne(
        { _id: doc._id },
        { $set: { id: doc._id.toString() } }
      );
    }
    console.log(`   ✅ Agregado campo 'id' a ${notificationsWithoutId.length} documentos`);
    
    // Corregir IDs inválidos
    const allNotifications = await notificationsCollection.find({}).toArray();
    let fixedCount = 0;
    for (const doc of allNotifications) {
      if (doc.id && doc.id !== doc._id.toString()) {
        await notificationsCollection.updateOne(
          { _id: doc._id },
          { $set: { id: doc._id.toString() } }
        );
        fixedCount++;
      }
    }
    if (fixedCount > 0) {
      console.log(`   ✅ Corregidos ${fixedCount} documentos con id inválido`);
    }
    
    // 2. Migrar UserPreferences
    console.log('\n📋 Paso 2: Migrando documentos UserPreferences...');
    const userPrefs = await userPreferencesCollection.find({}).toArray();
    console.log(`   Encontrados ${userPrefs.length} documentos`);
    
    for (const doc of userPrefs) {
      const updates = {};
      const unsetFields = {};
      let needsUpdate = false;
      
      // Obtener todas las notificaciones del usuario
      const userId = doc.userId;
      const allUserNotifications = await notificationsCollection.find({
        userId: userId
      }).toArray();
      
      // Crear allNotificationIds con los IDs de todas las notificaciones
      const allNotificationIds = allUserNotifications.map(n => n.id || n._id.toString());
      
      // Crear activeNotificationIds con los IDs de notificaciones activas
      const activeNotifications = allUserNotifications.filter(n => n.status === 'active');
      const activeNotificationIds = activeNotifications.map(n => n.id || n._id.toString());
      
      // Si tiene myNotificationIds, migrarlo a allNotificationIds
      if (doc.myNotificationIds && Array.isArray(doc.myNotificationIds) && doc.myNotificationIds.length > 0) {
        // Combinar myNotificationIds existentes con las notificaciones encontradas
        const combinedIds = [...new Set([...doc.myNotificationIds, ...allNotificationIds])];
        updates.allNotificationIds = combinedIds;
        unsetFields.myNotificationIds = "";
        needsUpdate = true;
      } else if (!doc.allNotificationIds || doc.allNotificationIds.length === 0) {
        // Si no tiene allNotificationIds, crearlo desde las notificaciones
        updates.allNotificationIds = allNotificationIds;
        needsUpdate = true;
      }
      
      // Asegurar que activeNotificationIds existe y está actualizado
      if (!doc.activeNotificationIds || JSON.stringify(doc.activeNotificationIds.sort()) !== JSON.stringify(activeNotificationIds.sort())) {
        updates.activeNotificationIds = activeNotificationIds;
        needsUpdate = true;
      }
      
      // Eliminar myNotificationIds si existe
      if (doc.myNotificationIds) {
        unsetFields.myNotificationIds = "";
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const updateOp = {};
        if (Object.keys(updates).length > 0) {
          updateOp.$set = updates;
        }
        if (Object.keys(unsetFields).length > 0) {
          updateOp.$unset = unsetFields;
        }
        
        await userPreferencesCollection.updateOne(
          { _id: doc._id },
          updateOp
        );
        console.log(`   ✅ Actualizado documento ${doc._id}`);
        console.log(`      - allNotificationIds: ${updates.allNotificationIds?.length || doc.allNotificationIds?.length || 0} notificaciones`);
        console.log(`      - activeNotificationIds: ${updates.activeNotificationIds?.length || doc.activeNotificationIds?.length || 0} notificaciones`);
      }
    }
    
    // 3. Verificar resultados
    console.log('\n📊 Verificación final:');
    const finalUserPrefs = await userPreferencesCollection.countDocuments({});
    const userPrefsWithAllIds = await userPreferencesCollection.countDocuments({ allNotificationIds: { $exists: true } });
    const userPrefsWithActiveIds = await userPreferencesCollection.countDocuments({ activeNotificationIds: { $exists: true } });
    const userPrefsWithMyIds = await userPreferencesCollection.countDocuments({ myNotificationIds: { $exists: true } });
    const notificationsWithId = await notificationsCollection.countDocuments({ id: { $exists: true } });
    const totalNotifications = await notificationsCollection.countDocuments({});
    
    console.log(`   UserPreferences totales: ${finalUserPrefs}`);
    console.log(`   UserPreferences con allNotificationIds: ${userPrefsWithAllIds}`);
    console.log(`   UserPreferences con activeNotificationIds: ${userPrefsWithActiveIds}`);
    console.log(`   UserPreferences con myNotificationIds (obsoleto): ${userPrefsWithMyIds}`);
    console.log(`   Notifications con campo 'id': ${notificationsWithId}/${totalNotifications}`);
    
    if (userPrefsWithMyIds > 0) {
      console.log(`   ⚠️  Aún existen ${userPrefsWithMyIds} documentos con myNotificationIds. Ejecuta el script nuevamente.`);
    }
    
    console.log('\n✅ Migración completada exitosamente.');
    
  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
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

// Ejecutar la migración
migrateUserPreferences();

