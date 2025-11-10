const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');

// POST - Crear nueva notificación
const createNotification = async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', req.body);
    const { userId, name, type, condition, value, message, location } = req.body;

    // Validar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

            // Buscar o crear UserPreferences
            let userPreferences = await UserPreferences.findOne({ userId });
            if (!userPreferences) {
              console.log('📝 Creando UserPreferences para usuario:', userId);
              userPreferences = new UserPreferences({
                userId,
                allNotificationIds: [],
                activeNotificationIds: [],
                totalNotifications: 0,
                theme: 'auto'
              });
              await userPreferences.save();
            }

    // El campo 'id' se genera automáticamente en el modelo, no debe venir en el request
    // Si viene, lo ignoramos para evitar conflictos
    if (req.body.id) {
      console.warn('⚠️ Se recibió el campo "id" en el request, será ignorado. El ID se genera automáticamente.');
      delete req.body.id;
    }

    // Crear la notificación
    console.log('📝 Creando notificación con datos:', {
      userId,
      name,
      type,
      condition,
      value,
      message,
      location: location || 'Todas las ubicaciones',
      status: 'inactive'
    });

    const notification = new Notification({
      userId,
      name,
      type,
      condition,
      value,
      message,
      location: location || 'Todas las ubicaciones',
      status: 'inactive'
    });

    await notification.save();
    console.log('✅ Notificación creada con ID:', notification._id);

    // Actualizar UserPreferences con la nueva notificación
    // Agregar a allNotificationIds (todas las notificaciones)
    // Si está activa, también agregar a activeNotificationIds
    const updateData = {
      $addToSet: { allNotificationIds: notification.id || notification._id.toString() },
      $inc: { totalNotifications: 1 }
    };
    
    if (notification.status === 'active') {
      updateData.$addToSet.activeNotificationIds = notification.id || notification._id.toString();
    }
    
    await UserPreferences.findOneAndUpdate(
      { userId },
      updateData
    );
    console.log('✅ UserPreferences actualizado');

    res.status(201).json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: notification
    });

  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Manejar específicamente el error de índice duplicado en el campo 'id'
    if (error.message && error.message.includes('E11000') && error.message.includes('id_1')) {
      console.error('❌ Error de índice duplicado detectado. El índice "id_1" debe eliminarse de MongoDB.');
      return res.status(500).json({
        success: false,
        message: 'Error de base de datos: existe un índice problemático en el campo "id". Contacte al administrador del sistema.',
        error: 'E11000 duplicate key error - índice id_1 debe eliminarse',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    const notification = await Notification.findById(id);

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
    // El campo 'id' no debe actualizarse manualmente, se genera automáticamente
    if (req.body.id) {
      console.warn('⚠️ Se recibió el campo "id" en el body de actualización, será ignorado.');
      delete req.body.id;
    }
    const updateData = req.body;

    // Obtener la notificación antes de actualizar para verificar el status anterior
    const oldNotification = await Notification.findById(id);
    if (!oldNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Si el status cambió, actualizar UserPreferences
    if (updateData.status && updateData.status !== oldNotification.status) {
      const notificationId = notification.id || notification._id.toString();
      const userId = notification.userId;
      
      if (updateData.status === 'active') {
        // Agregar a activeNotificationIds
        await UserPreferences.findOneAndUpdate(
          { userId },
          { 
            $addToSet: { 
              activeNotificationIds: notificationId,
              allNotificationIds: notificationId
            }
          }
        );
      } else if (updateData.status === 'inactive') {
        // Remover de activeNotificationIds
        await UserPreferences.findOneAndUpdate(
          { userId },
          { 
            $pull: { 
              activeNotificationIds: notificationId
            }
          }
        );
      }
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

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Activar la notificación
    await notification.activate();

    // Actualizar UserPreferences: agregar a activeNotificationIds
    await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        $addToSet: { 
          activeNotificationIds: notification.id || notification._id.toString(),
          allNotificationIds: notification.id || notification._id.toString()
        }
      }
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

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Desactivar la notificación
    await notification.deactivate();

    // Actualizar UserPreferences: remover de activeNotificationIds
    await UserPreferences.findOneAndUpdate(
      { userId },
      { 
        $pull: { 
          activeNotificationIds: notification.id || notification._id.toString()
        }
      }
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

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Obtener el ID de la notificación antes de eliminarla
    const notificationId = notification.id || notification._id.toString();
    
    // Eliminar la notificación
    await Notification.findByIdAndDelete(id);

    // Remover de allNotificationIds, activeNotificationIds y actualizar contador
    await UserPreferences.findOneAndUpdate(
      { userId },
      {
        $pull: {
          allNotificationIds: notificationId,
          activeNotificationIds: notificationId
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
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
