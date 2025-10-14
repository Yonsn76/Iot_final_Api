require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/database');
const sensorRoutes = require('./routes/sensorRoutes');
const userRoutes = require('./routes/userRoutes');
const userPreferencesRoutes = require('./routes/userPreferencesRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Conectar a la base de datos
connectDB();

// Middleware básico
app.use(cors());
app.use(express.json());

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ message: 'Pagina equivocado aca no es' });
});

// Endpoint para solicitar datos nuevos del Arduino
app.post('/api/sensors/request', async (req, res) => {
  try {
    console.log('📡 Solicitud de datos nuevos recibida del dashboard');
    
    // IP del Arduino en Wokwi (cambiar por la IP real que se muestre en el Serial)
    const ARDUINO_IP = '192.168.1.100'; // Cambiar por la IP real del Arduino
    
    console.log(`🚀 Enviando comando GET al Arduino en ${ARDUINO_IP}/read`);
    
    // Hacer petición GET simple al Arduino para que lea sensores
    const response = await fetch(`http://${ARDUINO_IP}/read`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const arduinoResponse = await response.text();
      console.log('✅ Arduino respondió:', arduinoResponse);
      
      res.json({ 
        success: true, 
        message: 'Comando enviado al IoT. Sensores leídos exitosamente',
        timestamp: new Date().toISOString(),
        arduino_response: arduinoResponse,
        action: 'READ_IOT_SENSORS',
        status: 'command_sent'
      });
    } else {
      throw new Error(`Error del Arduino: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error al comunicarse con Arduino:', error);
    res.status(500).json({ 
      success: false, 
      error: `Error al enviar comando al IoT: ${error.message}`,
      note: 'Verificar que el Arduino esté funcionando y la IP sea correcta'
    });
  }
});

// Rutas de la API
app.use('/api/sensors', sensorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/notifications', notificationRoutes);

// Puerto
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/sensors`);
  console.log(`📡 Solicitar datos: http://localhost:${PORT}/api/sensors/request`);
});
