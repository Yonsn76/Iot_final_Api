const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');
const Notification = require('../models/Notification');

// POST - Crear o actualizar preferencias del usuario
const saveUserPreferences = async (req, res) => {
  try {
    const { userId, preferredSensorId, allNotificationIds, activeNotificationIds } = req.body;

    // Validar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar preferencias existentes
    let userPreferences = await UserPreferences.findOne({ userId });

    if (userPreferences) {
      // Actualizar preferencias existentes
      userPreferences.preferredSensorId = preferredSensorId;
      userPreferences.allNotificationIds = allNotificationIds || [];
      userPreferences.activeNotificationIds = activeNotificationIds || [];
    } else {
      // Crear nuevas preferencias
      userPreferences = new UserPreferences({
        userId,
        preferredSensorId,
        allNotificationIds: allNotificationIds || [],
        activeNotificationIds: activeNotificationIds || []
      });
    }

    await userPreferences.save();

    // Obtener contador de notificaciones
    const totalNotifications = await Notification.countDocuments({ userId });

    // Obtener datos del usuario mediante populate
    const populatedPreferences = await UserPreferences.findById(userPreferences._id)
      .populate('userId', 'username email')
      .select('-__v');

    res.status(200).json({
      success: true,
      message: 'Preferencias guardadas exitosamente',
      data: {
        id: populatedPreferences._id,
        userId: populatedPreferences.userId._id,
        username: populatedPreferences.userId.username,
        email: populatedPreferences.userId.email,
        preferredSensorId: populatedPreferences.preferredSensorId,
        allNotificationIds: populatedPreferences.allNotificationIds,
        activeNotificationIds: populatedPreferences.activeNotificationIds,
        totalNotifications: totalNotifications,
        updatedAt: populatedPreferences.updatedAt
      }
    });

  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener preferencias del usuario
const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const userPreferences = await UserPreferences.findOne({ userId })
      .populate('userId', 'username email')
      .select('-__v');

    if (!userPreferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias no encontradas para este usuario'
      });
    }

    // Obtener todas las notificaciones del usuario por IDs
    const allNotifications = await Notification.find({
      id: { $in: userPreferences.allNotificationIds }
    });

    // Obtener notificaciones activas completas
    const activeNotifications = await Notification.find({
      id: { $in: userPreferences.activeNotificationIds }
    });

    const response = {
      ...userPreferences.toObject(),
      allNotifications,
      activeNotifications,
      totalNotifications: allNotifications.length
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener todas las preferencias (para administración)
const getAllUserPreferences = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'lastUpdated', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const userPreferences = await UserPreferences.find()
      .populate('userId', 'username email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // Excluir campo __v

    const total = await UserPreferences.countDocuments();

    res.status(200).json({
      success: true,
      data: userPreferences,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error getting all user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener solo el sensor preferido del usuario
const getPreferredSensor = async (req, res) => {
  try {
    const { userId } = req.params;

    const userPreferences = await UserPreferences.findOne({ userId })
      .populate('userId', 'username')
      .select('preferredSensorId userId');

    if (!userPreferences) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: userPreferences.userId._id,
        username: userPreferences.userId.username,
        preferredSensorId: userPreferences.preferredSensorId
      }
    });

  } catch (error) {
    console.error('Error getting preferred sensor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET - Obtener estadísticas de preferencias
const getPreferencesStats = async (req, res) => {
  try {
    const totalUsers = await UserPreferences.countDocuments();
    
    const sensorStats = await UserPreferences.aggregate([
      {
        $group: {
          _id: '$preferredSensorId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const notificationStats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          activeNotifications: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          customNotifications: { $sum: { $cond: [{ $eq: ['$status', 'custom'] }, 1, 0] } },
          archivedNotifications: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
          avgNotificationsPerUser: { $avg: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        sensorStats,
        notificationStats: notificationStats[0] || {
          totalNotifications: 0,
          activeNotifications: 0,
          customNotifications: 0,
          archivedNotifications: 0,
          avgNotificationsPerUser: 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting preferences stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// PUT - Actualizar preferencias del usuario
const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Validar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // updatedAt se actualiza automáticamente con timestamps: true

    const userPreferences = await UserPreferences.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true } // upsert: true crea el documento si no existe
    ).populate('userId', 'username email');

    // Obtener contador de notificaciones
    const totalNotifications = await Notification.countDocuments({ userId });

    res.status(200).json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      data: {
        id: userPreferences._id,
        userId: userPreferences.userId._id,
        username: userPreferences.userId.username,
        email: userPreferences.userId.email,
        preferredSensorId: userPreferences.preferredSensorId,
        allNotificationIds: userPreferences.allNotificationIds,
        activeNotificationIds: userPreferences.activeNotificationIds,
        totalNotifications: totalNotifications,
        updatedAt: userPreferences.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// DELETE - Eliminar preferencias del usuario
const deleteUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const userPreferences = await UserPreferences.findOneAndDelete({ userId });

    if (!userPreferences) {
      return res.status(404).json({
        success: false,
        message: 'Preferencias no encontradas para este usuario'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Preferencias eliminadas exitosamente'
    });

  } catch (error) {
    console.error('Error deleting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  saveUserPreferences,
  getUserPreferences,
  getAllUserPreferences,
  getPreferredSensor,
  getPreferencesStats,
  updateUserPreferences,
  deleteUserPreferences
};
