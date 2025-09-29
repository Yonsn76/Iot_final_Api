const express = require('express');
const router = express.Router();
const {
  saveUserPreferences,
  getUserPreferences,
  getAllUserPreferences,
  getPreferredSensor,
  getPreferencesStats,
  updateUserPreferences,
  deleteUserPreferences
} = require('../controllers/userPreferencesController');

const { authenticateToken } = require('../middleware/auth');

// POST - Crear o actualizar preferencias del usuario
router.post('/', authenticateToken, saveUserPreferences);

// GET - Obtener todas las preferencias (para administración)
router.get('/', authenticateToken, getAllUserPreferences);

// GET - Obtener estadísticas de preferencias
router.get('/stats', authenticateToken, getPreferencesStats);

// GET - Obtener preferencias del usuario por ID
router.get('/:userId', authenticateToken, getUserPreferences);

// GET - Obtener solo el sensor preferido del usuario
router.get('/:userId/sensor', authenticateToken, getPreferredSensor);

// PUT - Actualizar preferencias del usuario por ID
router.put('/:userId', authenticateToken, updateUserPreferences);

// DELETE - Eliminar preferencias del usuario por ID
router.delete('/:userId', authenticateToken, deleteUserPreferences);

module.exports = router;
