const mongoose = require('mongoose');
const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');

// Script de migración para eliminar campos redundantes de UserPreferences
const migrateUserPreferences = async () => {
  try {
    console.log('🔄 Iniciando migración de UserPreferences...');
    
    // Conectar a la base de datos
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://yonsn:1234@cluster0.7imrsfw.mongodb.net/iot_sensors?retryWrites=true&w=majority";
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los documentos de UserPreferences
    const allPreferences = await UserPreferences.find({});
    console.log(`📊 Encontrados ${allPreferences.length} registros de preferencias`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const preference of allPreferences) {
      try {
        // Verificar que el usuario existe
        const user = await User.findById(preference.userId);
        if (!user) {
          console.log(`⚠️  Usuario ${preference.userId} no encontrado, saltando...`);
          continue;
        }

        // Eliminar campos redundantes usando $unset
        await UserPreferences.updateOne(
          { _id: preference._id },
          { 
            $unset: { 
              username: 1, 
              email: 1 
            } 
          }
        );

        updatedCount++;
        console.log(`✅ Actualizado registro ${preference._id}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error actualizando registro ${preference._id}:`, error.message);
      }
    }

    console.log('\n📈 Resumen de migración:');
    console.log(`✅ Registros actualizados: ${updatedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total procesados: ${allPreferences.length}`);

    // Verificar que la migración fue exitosa
    const remainingRedundantFields = await UserPreferences.find({
      $or: [
        { username: { $exists: true } },
        { email: { $exists: true } }
      ]
    });

    if (remainingRedundantFields.length === 0) {
      console.log('🎉 ¡Migración completada exitosamente!');
    } else {
      console.log(`⚠️  Aún quedan ${remainingRedundantFields.length} registros con campos redundantes`);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  }
};

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrateUserPreferences();
}

module.exports = migrateUserPreferences;
