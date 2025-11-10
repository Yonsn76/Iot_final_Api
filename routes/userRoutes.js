const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');

const { authenticateToken } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.post('/register', register);           // Registrar nuevo usuario
router.post('/login', login);                 // Iniciar sesión

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, getProfile);                    // Obtener perfil propio
router.put('/profile', authenticateToken, updateProfile);                 // Actualizar perfil propio
router.put('/change-password', authenticateToken, changePassword);        // Cambiar contraseña del usuario autenticado

// Rutas protegidas (requieren autenticación)
router.get('/', authenticateToken, getAllUsers);           // Obtener todos los usuarios
router.get('/search', authenticateToken, searchUsers);      // Buscar usuarios
router.get('/:id', authenticateToken, getUserById);        // Obtener usuario por ID
router.put('/:id', authenticateToken, updateUser);         // Actualizar usuario por ID
router.delete('/:id', authenticateToken, deleteUser);      // Eliminar usuario

module.exports = router;
