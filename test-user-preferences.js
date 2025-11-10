const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserPreferences = require('./models/UserPreferences');
const Notification = require('./models/Notification');

async function testUserPreferences() {
  try {
    console.log('🧪 Probando UserPreferences con myNotificationIds');
    
    // Crear un usuario de prueba
    const testUserId = new mongoose.Types.ObjectId();
    
    // Crear algunas notificaciones de prueba
    const notifications = [];
    for (let i = 1; i <= 3; i++) {
      const notification = new Notification({
        userId: testUserId,
        name: `Notificación de Prueba ${i}`,
        type: 'temperature',
        condition: 'mayor_que',
        value: 25 + i,
        message: `Mensaje de prueba ${i}`,
        location: 'Sala de Pruebas',
        status: 'custom'
      });
      
      await notification.save();
      notifications.push(notification);
      console.log(`✅ Notificación ${i} creada con ID: ${notification.id}`);
    }
    
    // Crear UserPreferences con myNotificationIds
    const userPrefs = new UserPreferences({
      userId: testUserId,
      preferredSensorId: 'sensor_test_123',
      myNotificationIds: notifications.map(n => n.id),
      totalNotifications: notifications.length,
      theme: 'dark'
    });
    
    await userPrefs.save();
    console.log('✅ UserPreferences creado con myNotificationIds:', userPrefs.myNotificationIds);
    
    // Buscar y verificar
    const found = await UserPreferences.findById(userPrefs._id);
    console.log('📊 UserPreferences encontrado:', {
      myNotificationIds: found.myNotificationIds,
      totalNotifications: found.totalNotifications,
      theme: found.theme,
      preferredSensorId: found.preferredSensorId
    });
    
    // Agregar una nueva notificación
    const newNotification = new Notification({
      userId: testUserId,
      name: 'Nueva Notificación',
      type: 'humidity',
      condition: 'menor_que',
      value: 60,
      message: 'Nueva notificación de prueba',
      location: 'Cocina',
      status: 'custom'
    });
    
    await newNotification.save();
    console.log('✅ Nueva notificación creada con ID:', newNotification.id);
    
    // Actualizar UserPreferences
    await UserPreferences.findByIdAndUpdate(userPrefs._id, {
      $addToSet: { myNotificationIds: newNotification.id },
      $inc: { totalNotifications: 1 }
    });
    
    const updated = await UserPreferences.findById(userPrefs._id);
    console.log('✅ UserPreferences actualizado:', {
      myNotificationIds: updated.myNotificationIds,
      totalNotifications: updated.totalNotifications
    });
    
    // Limpiar datos de prueba
    await UserPreferences.findByIdAndDelete(userPrefs._id);
    await Notification.deleteMany({ userId: testUserId });
    console.log('🧹 Datos de prueba eliminados');
    
    console.log('🎉 Prueba completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    mongoose.connection.close();
  }
}

testUserPreferences();








