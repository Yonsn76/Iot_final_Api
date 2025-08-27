const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: './config.env' });

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Importar rutas
const sensorRoutes = require('./routes/sensorRoutes');

// Inicializar Express
const app = express();

// Conectar a la base de datos
connectDB();

// Middleware de seguridad
app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tu-dominio.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API de Sensores IoT funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      sensors: '/api/sensors',
      stats: '/api/sensors/stats/overview',
      latest: '/api/sensors/latest',
      range: '/api/sensors/range'
    },
    documentation: 'Consulta la documentación para más detalles'
  });
});

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ API funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Montar rutas
app.use('/api/sensors', sensorRoutes);

// Middleware para rutas no encontradas
app.use(notFound);

// Middleware de manejo de errores
app.use(errorHandler);

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/sensors`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
