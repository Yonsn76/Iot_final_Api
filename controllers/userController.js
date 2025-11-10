const jwt = require('jsonwebtoken');
const userProvider = require('../providers/userProvider');
const User = require('../models/User');

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'tu_secreto_jwt_por_defecto',
    { expiresIn: '24h' }
  );
};

// Registrar nuevo usuario
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Username, email y password son requeridos'
      });
    }

    // Verificar si el email ya existe
    const emailExists = await userProvider.emailExists(email);
    if (emailExists) {
      return res.status(400).json({ 
        error: 'Email ya registrado',
        message: 'Ya existe un usuario con este email'
      });
    }

    // Verificar si el username ya existe
    const usernameExists = await userProvider.usernameExists(username);
    if (usernameExists) {
      return res.status(400).json({ 
        error: 'Username ya existe',
        message: 'Ya existe un usuario con este nombre de usuario'
      });
    }

    // Crear el usuario
    const user = await userProvider.create({ username, email, password });
    
    // Generar token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        message: 'Email y password son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await userProvider.getByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }


    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token
    const token = generateToken(user._id);

    res.json({
      message: 'Inicio de sesión exitoso',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    res.json({
      message: 'Perfil obtenido exitosamente',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Actualizar perfil del usuario autenticado
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // No permitir cambiar el rol desde aquí
    if (updateData.role) {
      delete updateData.role;
    }

    const user = await userProvider.update(userId, updateData);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se pudo encontrar el usuario'
      });
    }

    res.json({
      message: 'Perfil actualizado exitosamente',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener todos los usuarios (solo admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await userProvider.getAll();
    res.json({
      message: 'Usuarios obtenidos exitosamente',
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Obtener usuario por ID (solo admin)
const getUserById = async (req, res) => {
  try {
    const user = await userProvider.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario con ese ID'
      });
    }
    res.json({
      message: 'Usuario obtenido exitosamente',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Actualizar usuario por ID (solo admin)
const updateUser = async (req, res) => {
  try {
    const user = await userProvider.update(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario con ese ID'
      });
    }
    res.json({
      message: 'Usuario actualizado exitosamente',
      user
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Eliminar usuario (soft delete) con eliminación en cascada
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Verificar que el usuario existe antes de eliminar
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario con ese ID'
      });
    }

    // Contar registros relacionados antes de eliminar
    const UserPreferences = require('../models/UserPreferences');
    const Notification = require('../models/Notification');
    
    const preferencesCount = await UserPreferences.countDocuments({ userId });
    const notificationsCount = await Notification.countDocuments({ userId });
    
    console.log(`📊 Eliminando usuario ${userId}:`);
    console.log(`   - Preferencias: ${preferencesCount}`);
    console.log(`   - Notificaciones: ${notificationsCount}`);
    
    // Eliminar usuario con cascada
    const deletedUser = await userProvider.delete(userId);
    
    if (!deletedUser) {
      return res.status(500).json({ 
        error: 'Error en eliminación',
        message: 'No se pudo eliminar el usuario'
      });
    }
    
    res.json({
      success: true,
      message: 'Usuario y todos sus datos relacionados eliminados exitosamente',
      deletedData: {
        user: {
          id: deletedUser._id,
          username: deletedUser.username,
          email: deletedUser.email
        },
        preferences: preferencesCount,
        notifications: notificationsCount
      }
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Buscar usuarios
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ 
        error: 'Parámetro de búsqueda requerido',
        message: 'Debes proporcionar un término de búsqueda'
      });
    }

    const users = await userProvider.search(q);
    res.json({
      message: 'Búsqueda completada',
      users,
      count: users.length,
      searchTerm: q
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

// Cambiar contraseña del usuario autenticado
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Validar datos de entrada
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Datos requeridos',
        message: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Contraseña inválida',
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener el usuario con la contraseña para verificar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'No se pudo encontrar el usuario'
      });
    }

    // Verificar la contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual es incorrecta'
      });
    }

    // Verificar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña inválida',
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    // Actualizar la contraseña
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  changePassword
};
