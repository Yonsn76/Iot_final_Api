require('dotenv').config();
const mongoose = require('mongoose');
const UserPreferences = require('../models/UserPreferences');
const Notification = require('../models/Notification');

// Conectar a la base de datos
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://yonsn:1234@cluster0.7imrsfw.mongodb.net/iot_sensors?retryWrites=true&w=majority";
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB conectado para migración');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para migrar notificaciones
const migrateNotifications = async () => {
  try {
    console.log('🔄 Iniciando migración de notificaciones...');
    
    // Obtener todas las preferencias de usuario
    const userPreferences = await UserPreferences.find();
    console.log(`📊 Encontradas ${userPreferences.length} preferencias de usuario`);
    
    let totalMigrated = 0;
    let totalErrors = 0;
    
    for (const pref of userPreferences) {
      try {
        console.log(`\n🔄 Procesando usuario: ${pref.userId}`);
        
        // Migrar customNotifications si existen
        if (pref.customNotifications && pref.customNotifications.length > 0) {
          console.log(`  📝 Migrando ${pref.customNotifications.length} notificaciones personalizadas`);
          
          for (const customNotif of pref.customNotifications) {
            try {
              const notification = new Notification({
                id: customNotif.id || new mongoose.Types.ObjectId().toString(),
                userId: pref.userId,
                name: customNotif.name || 'Notificación sin nombre',
                enabled: customNotif.enabled !== undefined ? customNotif.enabled : true,
                type: customNotif.type || 'temperature',
                condition: customNotif.condition || 'mayor_que',
                value: customNotif.value || 0,
                message: customNotif.message || '',
                locationScope: customNotif.locationScope || 'all',
                specificLocation: customNotif.specificLocation || null,
                status: 'custom',
                createdAt: customNotif.createdAt ? new Date(customNotif.createdAt) : new Date(),
                lastTriggered: customNotif.lastTriggered ? new Date(customNotif.lastTriggered) : null
              });
              
              await notification.save();
              activeNotificationIds.push(notification.id);
              totalMigrated++;
            } catch (error) {
              console.error(`    ❌ Error migrando notificación ${customNotif.id}:`, error.message);
              totalErrors++;
            }
          }
        }
        
        // Migrar activeNotifications si existen
        let activeNotificationIds = [];
        if (pref.activeNotifications && pref.activeNotifications.length > 0) {
          console.log(`  🔥 Migrando ${pref.activeNotifications.length} notificaciones activas`);
          
          for (const activeNotif of pref.activeNotifications) {
            try {
              // Crear la notificación si no existe
              let notification = await Notification.findOne({ id: activeNotif.id });
              
              if (!notification) {
                notification = new Notification({
                  id: activeNotif.id || new mongoose.Types.ObjectId().toString(),
                  userId: pref.userId,
                  name: activeNotif.name || 'Notificación activa sin nombre',
                  enabled: activeNotif.enabled !== undefined ? activeNotif.enabled : true,
                  type: activeNotif.type || 'temperature',
                  condition: activeNotif.condition || 'mayor_que',
                  value: activeNotif.value || 0,
                  message: activeNotif.message || '',
                  locationScope: activeNotif.locationScope || 'all',
                  specificLocation: activeNotif.specificLocation || null,
                  status: 'active',
                  createdAt: activeNotif.createdAt ? new Date(activeNotif.createdAt) : new Date(),
                  lastTriggered: activeNotif.lastTriggered ? new Date(activeNotif.lastTriggered) : null
                });
                
                await notification.save();
                totalMigrated++;
              } else {
                // Actualizar estado a activo
                notification.status = 'active';
                await notification.save();
              }
              
              activeNotificationIds.push(notification.id);
            } catch (error) {
              console.error(`    ❌ Error migrando notificación activa ${activeNotif.id}:`, error.message);
              totalErrors++;
            }
          }
        }
        
        // Actualizar UserPreferences con la nueva estructura
        await UserPreferences.findByIdAndUpdate(pref._id, {
          allNotificationIds: activeNotificationIds, // Todas las notificaciones del usuario
          activeNotificationIds: activeNotificationIds, // Por ahora, todas son activas
          $unset: { 
            customNotifications: 1, 
            activeNotifications: 1 
          }
        });
        
        console.log(`  ✅ Usuario ${pref.userId} migrado exitosamente`);
        
      } catch (error) {
        console.error(`❌ Error procesando usuario ${pref.userId}:`, error.message);
        totalErrors++;
      }
    }
    
    console.log('\n🎉 Migración completada!');
    console.log(`📊 Estadísticas:`);
    console.log(`  ✅ Notificaciones migradas: ${totalMigrated}`);
    console.log(`  ❌ Errores: ${totalErrors}`);
    console.log(`  👥 Usuarios procesados: ${userPreferences.length}`);
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
};

// Función para verificar la migración
const verifyMigration = async () => {
  try {
    console.log('\n🔍 Verificando migración...');
    
    const totalNotifications = await Notification.countDocuments();
    const totalUserPreferences = await UserPreferences.countDocuments();
    const preferencesWithOldFields = await UserPreferences.countDocuments({
      $or: [
        { customNotifications: { $exists: true } },
        { activeNotifications: { $exists: true } }
      ]
    });
    
    console.log(`📊 Verificación:`);
    console.log(`  📝 Total notificaciones: ${totalNotifications}`);
    console.log(`  👥 Total preferencias: ${totalUserPreferences}`);
    console.log(`  🔄 Preferencias con campos antiguos: ${preferencesWithOldFields}`);
    
    if (preferencesWithOldFields === 0) {
      console.log('✅ Migración exitosa - No quedan campos antiguos');
    } else {
      console.log('⚠️  Aún quedan campos antiguos por migrar');
    }
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error);
  }
};

// Función principal
const main = async () => {
  try {
    await connectDB();
    await migrateNotifications();
    await verifyMigration();
  } catch (error) {
    console.error('❌ Error en proceso principal:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { migrateNotifications, verifyMigration };
