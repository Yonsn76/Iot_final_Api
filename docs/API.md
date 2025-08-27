# API de Sensores IoT - Documentación

## Descripción
API RESTful para gestionar datos de sensores IoT (temperatura y humedad) implementada con el patrón MCP (Model-Controller-Provider).

## Estructura del Proyecto
```
IOT API/
├── config/
│   ├── database.js          # Configuración de base de datos
│   └── constants.js         # Constantes de la aplicación
├── controllers/
│   └── sensorController.js  # Controladores HTTP
├── middleware/
│   ├── errorHandler.js      # Manejo de errores
│   └── validation.js        # Validación de datos
├── models/
│   ├── plugins/
│   │   └── paginate.js      # Plugin de paginación
│   └── SensorData.js        # Modelo de datos
├── providers/
│   └── sensorProvider.js    # Lógica de negocio
├── routes/
│   └── sensorRoutes.js      # Definición de rutas
├── services/
│   ├── responseService.js   # Servicio de respuestas
│   └── validationService.js # Servicio de validación
└── server.js                # Servidor principal
```

## Patrón MCP Implementado

### Model (Modelo)
- **`models/SensorData.js`**: Define el esquema de MongoDB con validaciones y métodos estáticos

### Controller (Controlador)
- **`controllers/sensorController.js`**: Maneja las peticiones HTTP y respuestas
- **`routes/sensorRoutes.js`**: Define las rutas de la API

### Provider (Proveedor)
- **`providers/sensorProvider.js`**: Contiene la lógica de negocio y operaciones de base de datos

## Endpoints de la API

### Base URL
```
http://localhost:3000/api/sensors
```

### 1. Crear Sensor (POST)
```http
POST /api/sensors
Content-Type: application/json

{
  "temperatura": 25.5,
  "humedad": 60.0
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Dato de sensor creado exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "fecha": "2025-01-27T10:30:00.000Z",
    "temperatura": 25.5,
    "humedad": 60.0,
    "createdAt": "2025-01-27T10:30:00.000Z",
    "updatedAt": "2025-01-27T10:30:00.000Z"
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 2. Obtener Todos los Sensores (GET)
```http
GET /api/sensors?page=1&limit=10&sort=-fecha
```

**Parámetros de consulta:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)
- `sort`: Campo de ordenamiento (default: -fecha)

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": [...],
  "total": 50,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false,
  "nextPage": 2,
  "prevPage": null,
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 3. Obtener Sensor por ID (GET)
```http
GET /api/sensors/64f8a1b2c3d4e5f6a7b8c9d0
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "fecha": "2025-01-27T10:30:00.000Z",
    "temperatura": 25.5,
    "humedad": 60.0
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 4. Actualizar Sensor (PUT)
```http
PUT /api/sensors/64f8a1b2c3d4e5f6a7b8c9d0
Content-Type: application/json

{
  "temperatura": 26.0,
  "humedad": 58.5
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Dato de sensor actualizado exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "fecha": "2025-01-27T10:30:00.000Z",
    "temperatura": 26.0,
    "humedad": 58.5
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 5. Eliminar Sensor (DELETE)
```http
DELETE /api/sensors/64f8a1b2c3d4e5f6a7b8c9d0
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Dato de sensor eliminado exitosamente",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "fecha": "2025-01-27T10:30:00.000Z",
    "temperatura": 26.0,
    "humedad": 58.5
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 6. Obtener Estadísticas (GET)
```http
GET /api/sensors/stats/overview
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "totalRegistros": 50,
    "temperaturaPromedio": 24.5,
    "humedadPromedio": 58.3,
    "temperaturaMaxima": 32.1,
    "temperaturaMinima": 18.9,
    "humedadMaxima": 85.2,
    "humedadMinima": 45.1
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 7. Obtener por Rango de Fechas (GET)
```http
GET /api/sensors/range?startDate=2025-01-01&endDate=2025-01-31
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": {
    "count": 31,
    "data": [...]
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### 8. Obtener Datos Más Recientes (GET)
```http
GET /api/sensors/latest?limit=5
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": {
    "count": 5,
    "data": [...]
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## Validaciones

### Datos del Sensor
- **temperatura**: Número requerido entre -50°C y 100°C
- **humedad**: Número requerido entre 0% y 100%
- **fecha**: Opcional, se asigna automáticamente si no se proporciona

### Parámetros de Consulta
- **page**: Número entero positivo (default: 1)
- **limit**: Número entero entre 1 y 100 (default: 10)
- **sort**: Campo válido de ordenamiento
- **startDate/endDate**: Fechas válidas en formato ISO

## Códigos de Estado HTTP

- **200**: OK - Operación exitosa
- **201**: Created - Recurso creado exitosamente
- **400**: Bad Request - Error de validación
- **404**: Not Found - Recurso no encontrado
- **500**: Internal Server Error - Error interno del servidor

## Manejo de Errores

La API utiliza un middleware centralizado de manejo de errores que:
- Captura errores de validación
- Maneja errores de base de datos
- Proporciona respuestas de error estandarizadas
- Incluye detalles de error en modo desarrollo

## Características de la Implementación

### Seguridad
- Validación de entrada en todas las rutas
- Sanitización de datos
- Rate limiting configurable
- Headers de seguridad con Helmet

### Rendimiento
- Paginación automática
- Índices de base de datos optimizados
- Plugin de paginación personalizable

### Mantenibilidad
- Separación clara de responsabilidades (MCP)
- Constantes centralizadas
- Servicios reutilizables
- Respuestas estandarizadas

## Instalación y Uso

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp config.env.example config.env
# Editar config.env con tus credenciales
```

3. **Ejecutar la aplicación:**
```bash
npm start
```

4. **Probar la API:**
```bash
# Crear un sensor
curl -X POST http://localhost:3000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{"temperatura": 25.5, "humedad": 60.0}'

# Obtener todos los sensores
curl http://localhost:3000/api/sensors
```

## Dependencias Principales

- **Express.js**: Framework web
- **Mongoose**: ODM para MongoDB
- **Helmet**: Seguridad de headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Protección contra spam
- **Dotenv**: Variables de entorno
