const express = require('express');
const router = express.Router();
const {
  saveUserPreferences,
  getUserPreferences,
  updateUserPreferences,
  deleteUserPreferences
} = require('../controllers/userPreferencesController');

const { authenticateToken } = require('../middleware/auth');

// POST - Crear o actualizar preferencias del usuario
router.post('/', authenticateToken, saveUserPreferences);

// GET - Obtener preferencias del usuario por ID
router.get('/:userId', authenticateToken, getUserPreferences);

// PUT - Actualizar preferencias del usuario por ID
router.put('/:userId', authenticateToken, updateUserPreferences);

// DELETE - Eliminar preferencias del usuario por ID
router.delete('/:userId', authenticateToken, deleteUserPreferences);

module.exports = router;
