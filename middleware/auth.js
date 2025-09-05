const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar el token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido',
        message: 'Debes proporcionar un token de autenticación'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt_por_defecto');
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El usuario no existe o está inactivo'
      });
    }

    // Agregar el usuario a la request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'El token ha expirado, por favor inicia sesión nuevamente'
      });
    }
    
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: 'Error al verificar la autenticación'
    });
  }
};

// Middleware para verificar si el usuario es admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador'
    });
  }
};

// Middleware opcional para autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt_por_defecto');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En caso de error, continuar sin usuario autenticado
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
