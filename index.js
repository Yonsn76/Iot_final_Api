const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const connectDB = require('./config/database');
const sensorRoutes = require('./routes/sensorRoutes');

const app = express();

// Conectar a la base de datos
connectDB();

// Middleware básico
app.use(cors());
app.use(express.json());

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({ message: 'API de Sensores IoT - CRUD Simple' });
});

// Rutas de la API
app.use('/api/sensors', sensorRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/sensors`);
});
