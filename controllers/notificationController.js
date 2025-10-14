const Notification = require('../models/Notification');
const UserPreferences = require('../models/UserPreferences');

// POST - Crear nueva notificación
const createNotification = async (req, res) => {
  try {
    const { userId, name, type, condition, value, message, locationScope, specificLocation } = req.body;

    // Validar que el usuario existe
    const userPreferences = await UserPreferences.findOne({ userId });
    if (!userPreferences) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Crear la notificación
    const notification = new Notification({
      userId,
      name,
      type,
      condition,
      value,
      message,
      locationScope: locationScope || 'all',
      specificLocation: locationScope === 'specific' ? specificLocation : null,
      status: 'custom'
    });

    await notification.save();

    // Actualizar UserPreferences con la nueva notificación
    await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        $addToSet: { allNotificationIds: notification.id },
        $inc: { totalNotifications: 1 } 
      }
    );

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: notification
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener notificaciones de un usuario
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, type } = req.query;

    let query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener notificaciones activas de un usuario
const getActiveNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.getActiveByUserId(userId);

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error getting active notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener notificación por ID
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({ id });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error getting notification by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// PUT - Actualizar notificación
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const notification = await Notification.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notificación actualizada exitosamente',
      data: notification
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// PUT - Activar notificación
const activateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findOne({ id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Activar la notificación
    await notification.activate();

    // Agregar a activeNotificationIds si no está
    await UserPreferences.findOneAndUpdate(
      { userId },
      { $addToSet: { activeNotificationIds: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Notificación activada exitosamente',
      data: notification
    });

  } catch (error) {
    console.error('Error activating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// PUT - Desactivar notificación
const deactivateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findOne({ id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Desactivar la notificación
    await notification.deactivate();

    // Remover de activeNotificationIds
    await UserPreferences.findOneAndUpdate(
      { userId },
      { $pull: { activeNotificationIds: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Notificación desactivada exitosamente',
      data: notification
    });

  } catch (error) {
    console.error('Error deactivating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// DELETE - Eliminar notificación
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findOne({ id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Eliminar la notificación
    await Notification.findOneAndDelete({ id, userId });

    // Remover de ambos arrays y actualizar contador
    await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        $pull: { 
          allNotificationIds: id,
          activeNotificationIds: id 
        },
        $inc: { totalNotifications: -1 }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener estadísticas de notificaciones
const getNotificationStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await Notification.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          custom: { $sum: { $cond: [{ $eq: ['$status', 'custom'] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
          byType: {
            $push: {
              type: '$type',
              status: '$status'
            }
          }
        }
      },
      {
        $project: {
          total: 1,
          active: 1,
          custom: 1,
          archived: 1,
          typeDistribution: {
            $reduce: {
              input: '$byType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: { $concat: ['$$this.type', '_', '$$this.status'] },
                          v: 1
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        total: 0,
        active: 0,
        custom: 0,
        archived: 0,
        typeDistribution: {}
      }
    });

  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getActiveNotifications,
  getNotificationById,
  updateNotification,
  activateNotification,
  deactivateNotification,
  deleteNotification,
  getNotificationStats
};
