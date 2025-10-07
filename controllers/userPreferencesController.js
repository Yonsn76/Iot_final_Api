const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');

// POST - Crear o actualizar preferencias del usuario
const saveUserPreferences = async (req, res) => {
  try {
    const { userId, preferredSensorId, customNotifications, activeNotifications, totalNotifications } = req.body;

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
      userPreferences.customNotifications = customNotifications || [];
      userPreferences.activeNotifications = activeNotifications || [];
      userPreferences.totalNotifications = totalNotifications || 0;
    } else {
      // Crear nuevas preferencias
      userPreferences = new UserPreferences({
        userId,
        preferredSensorId,
        customNotifications: customNotifications || [],
        activeNotifications: activeNotifications || [],
        totalNotifications: totalNotifications || 0
      });
    }

    await userPreferences.save();

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
        customNotificationsCount: populatedPreferences.customNotifications.length,
        activeNotificationsCount: populatedPreferences.activeNotifications.length,
        totalNotifications: populatedPreferences.totalNotifications,
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

    res.status(200).json({
      success: true,
      data: userPreferences
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

    const notificationStats = await UserPreferences.aggregate([
      {
        $group: {
          _id: null,
          totalCustomNotifications: { $sum: { $size: '$customNotifications' } },
          totalActiveNotifications: { $sum: { $size: '$activeNotifications' } },
          avgNotificationsPerUser: { $avg: '$totalNotifications' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        sensorStats,
        notificationStats: notificationStats[0] || {
          totalCustomNotifications: 0,
          totalActiveNotifications: 0,
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

    res.status(200).json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      data: {
        id: userPreferences._id,
        userId: userPreferences.userId._id,
        username: userPreferences.userId.username,
        email: userPreferences.userId.email,
        preferredSensorId: userPreferences.preferredSensorId,
        customNotificationsCount: userPreferences.customNotifications.length,
        activeNotificationsCount: userPreferences.activeNotifications.length,
        totalNotifications: userPreferences.totalNotifications,
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
