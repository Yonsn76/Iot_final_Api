const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');

// POST - Crear o actualizar preferencias del usuario
const saveUserPreferences = async (req, res) => {
  try {
    const { userId, username, email, preferredSensorId, customNotifications, activeNotifications, totalNotifications } = req.body;

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
      userPreferences.username = username;
      userPreferences.email = email;
      userPreferences.preferredSensorId = preferredSensorId;
      userPreferences.customNotifications = customNotifications || [];
      userPreferences.activeNotifications = activeNotifications || [];
      userPreferences.totalNotifications = totalNotifications || 0;
      userPreferences.lastUpdated = new Date();
    } else {
      // Crear nuevas preferencias
      userPreferences = new UserPreferences({
        userId,
        username,
        email,
        preferredSensorId,
        customNotifications: customNotifications || [],
        activeNotifications: activeNotifications || [],
        totalNotifications: totalNotifications || 0,
        lastUpdated: new Date()
      });
    }

    await userPreferences.save();

    res.status(200).json({
      success: true,
      message: 'Preferencias guardadas exitosamente',
      data: {
        id: userPreferences._id,
        userId: userPreferences.userId,
        username: userPreferences.username,
        email: userPreferences.email,
        preferredSensorId: userPreferences.preferredSensorId,
        customNotificationsCount: userPreferences.customNotifications.length,
        activeNotificationsCount: userPreferences.activeNotifications.length,
        totalNotifications: userPreferences.totalNotifications,
        lastUpdated: userPreferences.lastUpdated
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

    const userPreferences = await UserPreferences.findOne({ userId });

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
      .select('preferredSensorId username');

    if (!userPreferences) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId,
        username: userPreferences.username,
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

    // Agregar timestamp de actualización
    updateData.lastUpdated = new Date();

    const userPreferences = await UserPreferences.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true } // upsert: true crea el documento si no existe
    );

    res.status(200).json({
      success: true,
      message: 'Preferencias actualizadas exitosamente',
      data: {
        id: userPreferences._id,
        userId: userPreferences.userId,
        username: userPreferences.username,
        email: userPreferences.email,
        preferredSensorId: userPreferences.preferredSensorId,
        customNotificationsCount: userPreferences.customNotifications.length,
        activeNotificationsCount: userPreferences.activeNotifications.length,
        totalNotifications: userPreferences.totalNotifications,
        lastUpdated: userPreferences.lastUpdated
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
