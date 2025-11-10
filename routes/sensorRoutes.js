const express = require('express');
const router = express.Router();
const {
  createSensor,
  getAllSensors,
  getSensorById,
  getSensorsByDateRange
} = require('../controllers/sensorController');

// Rutas para datos históricos de sensores
router.post('/', createSensor);                    // Crear nueva medición
router.get('/', getAllSensors);                    // Obtener todas las mediciones
router.get('/range', getSensorsByDateRange);       // Obtener por rango de fechas
router.get('/:id', getSensorById);                 // Obtener medición específica

module.exports = router;
