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
  searchUsers
} = require('../controllers/userController');

const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas (no requieren autenticación)
router.post('/register', register);           // Registrar nuevo usuario
router.post('/login', login);                 // Iniciar sesión

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, getProfile);                    // Obtener perfil propio
router.put('/profile', authenticateToken, updateProfile);                 // Actualizar perfil propio

// Rutas de administrador (requieren autenticación + rol admin)
router.get('/', authenticateToken, requireAdmin, getAllUsers);           // Obtener todos los usuarios
router.get('/search', authenticateToken, requireAdmin, searchUsers);      // Buscar usuarios
router.get('/:id', authenticateToken, requireAdmin, getUserById);        // Obtener usuario por ID
router.put('/:id', authenticateToken, requireAdmin, updateUser);         // Actualizar usuario por ID
router.delete('/:id', authenticateToken, requireAdmin, deleteUser);      // Eliminar usuario

module.exports = router;
