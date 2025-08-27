const express = require('express');
const router = express.Router();
const {
  createSensor,
  getAllSensors,
  getSensorById,
  updateSensor,
  deleteSensor
} = require('../controllers/sensorController');

// Rutas CRUD básicas
router.post('/', createSensor);           // Crear
router.get('/', getAllSensors);           // Obtener todos
router.get('/:id', getSensorById);        // Obtener por ID
router.put('/:id', updateSensor);         // Actualizar
router.delete('/:id', deleteSensor);      // Eliminar

module.exports = router;
