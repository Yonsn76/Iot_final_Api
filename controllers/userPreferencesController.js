const UserPreferences = require('../models/UserPreferences');
const User = require('../models/User');

// POST - Crear o actualizar preferencias del usuario
const saveUserPreferences = async (req, res) => {
  try {
    const { userId, username, email, preferredLocation, customNotifications, activeNotifications, totalNotifications } = req.body;

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
      userPreferences.preferredLocation = preferredLocation;
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
        preferredLocation,
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
        preferredLocation: userPreferences.preferredLocation,
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
        preferredLocation: userPreferences.preferredLocation,
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
  updateUserPreferences,
  deleteUserPreferences
};
