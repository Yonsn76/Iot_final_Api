const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iot_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./models/User');
const UserPreferences = require('./models/UserPreferences');
const Notification = require('./models/Notification');

async function testNotificationFlow() {
  try {
    console.log('🧪 Probando flujo completo de notificaciones');
    
    // 1. Crear un usuario de prueba
    const testUser = new User({
      username: 'test_user_notifications',
      email: 'test@notifications.com',
      password: 'password123'
    });
    
    await testUser.save();
    console.log('✅ Usuario de prueba creado:', testUser._id);
    
    // 2. Crear algunas notificaciones
    const notifications = [];
    for (let i = 1; i <= 3; i++) {
      const notification = new Notification({
        userId: testUser._id,
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
    
    // 3. Crear UserPreferences con myNotificationIds
    const userPrefs = new UserPreferences({
      userId: testUser._id,
      preferredSensorId: 'sensor_test_123',
      myNotificationIds: notifications.map(n => n.id),
      totalNotifications: notifications.length,
      theme: 'dark'
    });
    
    await userPrefs.save();
    console.log('✅ UserPreferences creado con myNotificationIds:', userPrefs.myNotificationIds);
    
    // 4. Simular la consulta que hace el frontend
    console.log('\n📊 Simulando consulta del frontend...');
    
    // Obtener notificaciones del usuario (como hace getUserNotifications)
    const userNotifications = await Notification.find({ userId: testUser._id }).sort({ createdAt: -1 });
    console.log('📱 Notificaciones obtenidas para el usuario:', userNotifications.length);
    userNotifications.forEach((notif, index) => {
      console.log(`  ${index + 1}. ${notif.name} (${notif.status}) - ID: ${notif.id}`);
    });
    
    // Obtener UserPreferences (como hace getUserPreferences)
    const userPreferences = await UserPreferences.findOne({ userId: testUser._id });
    console.log('⚙️ UserPreferences obtenido:', {
      myNotificationIds: userPreferences.myNotificationIds,
      totalNotifications: userPreferences.totalNotifications,
      theme: userPreferences.theme
    });
    
    // 5. Verificar consistencia
    console.log('\n🔍 Verificando consistencia...');
    const notificationIds = userNotifications.map(n => n.id);
    const preferenceIds = userPreferences.myNotificationIds;
    
    console.log('IDs en notificaciones:', notificationIds);
    console.log('IDs en UserPreferences:', preferenceIds);
    
    const missingInPreferences = notificationIds.filter(id => !preferenceIds.includes(id));
    const missingInNotifications = preferenceIds.filter(id => !notificationIds.includes(id));
    
    if (missingInPreferences.length === 0 && missingInNotifications.length === 0) {
      console.log('✅ Consistencia perfecta: todos los IDs coinciden');
    } else {
      console.log('⚠️ Inconsistencias encontradas:');
      if (missingInPreferences.length > 0) {
        console.log('  - IDs en notificaciones pero no en UserPreferences:', missingInPreferences);
      }
      if (missingInNotifications.length > 0) {
        console.log('  - IDs en UserPreferences pero no en notificaciones:', missingInNotifications);
      }
    }
    
    // 6. Simular agregar una nueva notificación
    console.log('\n➕ Simulando agregar nueva notificación...');
    const newNotification = new Notification({
      userId: testUser._id,
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
    await UserPreferences.findOneAndUpdate(
      { userId: testUser._id },
      { 
        $addToSet: { myNotificationIds: newNotification.id },
        $inc: { totalNotifications: 1 } 
      }
    );
    console.log('✅ UserPreferences actualizado');
    
    // Verificar actualización
    const updatedPrefs = await UserPreferences.findOne({ userId: testUser._id });
    const updatedNotifications = await Notification.find({ userId: testUser._id }).sort({ createdAt: -1 });
    
    console.log('📊 Después de agregar notificación:');
    console.log('  - Total notificaciones en BD:', updatedNotifications.length);
    console.log('  - Total en UserPreferences:', updatedPrefs.totalNotifications);
    console.log('  - IDs en UserPreferences:', updatedPrefs.myNotificationIds.length);
    
    // 7. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    await User.findByIdAndDelete(testUser._id);
    await UserPreferences.findOneAndDelete({ userId: testUser._id });
    await Notification.deleteMany({ userId: testUser._id });
    console.log('✅ Datos de prueba eliminados');
    
    console.log('\n🎉 Prueba del flujo completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNotificationFlow();









