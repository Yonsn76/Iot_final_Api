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

// Ruta de prueba (sin autenticación)
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API de notificaciones funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba para crear notificación (sin autenticación) - SOLO PARA DESARROLLO
if (process.env.NODE_ENV === 'development') {
  router.post('/test-create', async (req, res) => {
    try {
      const { createNotification } = require('../controllers/notificationController');
      await createNotification(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error en ruta de prueba',
        error: error.message
      });
    }
  });
}

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
