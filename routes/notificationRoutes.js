const express = require('express');
const router = express.Router();
const {
  createNotification,
  getUserNotifications,
  getActiveNotifications,
  getNotificationById,
  updateNotification,
  activateNotification,
  deactivateNotification,
  deleteNotification,
  getNotificationStats
} = require('../controllers/notificationController');

const { authenticateToken } = require('../middleware/auth');

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, createNotification);                    // Crear notificación
router.get('/user/:userId', authenticateToken, getUserNotifications);      // Obtener notificaciones de usuario
router.get('/user/:userId/active', authenticateToken, getActiveNotifications); // Obtener notificaciones activas
router.get('/:id', authenticateToken, getNotificationById);                // Obtener notificación por ID
router.put('/:id', authenticateToken, updateNotification);                 // Actualizar notificación
router.put('/:id/activate', authenticateToken, activateNotification);      // Activar notificación
router.put('/:id/deactivate', authenticateToken, deactivateNotification); // Desactivar notificación
router.delete('/:id', authenticateToken, deleteNotification);              // Eliminar notificación
router.get('/user/:userId/stats', authenticateToken, getNotificationStats); // Estadísticas de notificaciones

module.exports = router;
