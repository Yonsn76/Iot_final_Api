// Middleware para manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error.message = message;
    error.statusCode = 400;
  }

  // Error de duplicación de Mongoose
  if (err.code === 11000) {
    error.message = 'Datos duplicados';
    error.statusCode = 400;
  }

  // Error de cast de Mongoose
  if (err.name === 'CastError') {
    error.message = 'ID inválido';
    error.statusCode = 400;
  }

  // Error de conexión a MongoDB
  if (err.name === 'MongoNetworkError') {
    error.message = 'Error de conexión a la base de datos';
    error.statusCode = 503;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  notFound
};
