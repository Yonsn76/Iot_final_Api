# 🚀 API de Sensores IoT

API RESTful para gestionar datos de sensores IoT (temperatura y humedad) implementada con el patrón **MCP (Model-Controller-Provider)** para una arquitectura limpia y mantenible.

## ✨ Características

- **Patrón MCP**: Separación clara de responsabilidades
- **CRUD Completo**: Operaciones Create, Read, Update, Delete
- **Validación Robusta**: Validación de entrada y sanitización de datos
- **Paginación**: Sistema de paginación automática
- **Estadísticas**: Métricas agregadas de temperatura y humedad
- **Filtros Avanzados**: Búsqueda por rango de fechas
- **Respuestas Estandarizadas**: Formato consistente de respuestas
- **Manejo de Errores**: Sistema centralizado de manejo de errores
- **Seguridad**: Headers de seguridad, rate limiting, CORS

## 🏗️ Arquitectura MCP

### 📁 Estructura del Proyecto

```
IOT API/
├── 📁 config/                 # Configuración
│   ├── database.js           # Conexión a MongoDB
│   └── constants.js          # Constantes de la app
├── 📁 controllers/           # Controladores HTTP
│   └── sensorController.js   # Lógica de peticiones/respuestas
├── 📁 middleware/            # Middlewares
│   ├── errorHandler.js       # Manejo de errores
│   └── validation.js         # Validación de datos
├── 📁 models/                # Modelos de datos
│   ├── plugins/
│   │   └── paginate.js       # Plugin de paginación
│   └── SensorData.js         # Esquema de sensores
├── 📁 providers/             # Lógica de negocio
│   └── sensorProvider.js     # Operaciones de sensores
├── 📁 routes/                # Definición de rutas
│   └── sensorRoutes.js       # Endpoints de la API
├── 📁 services/              # Servicios auxiliares
│   ├── responseService.js    # Respuestas estandarizadas
│   └── validationService.js  # Validación de datos
├── 📁 docs/                  # Documentación
│   └── API.md                # Documentación completa
├── server.js                 # Servidor principal
└── README.md                 # Este archivo
```

### 🔄 Flujo de Datos MCP

1. **Model**: Define el esquema de datos y métodos estáticos
2. **Controller**: Maneja peticiones HTTP y respuestas
3. **Provider**: Contiene la lógica de negocio y operaciones de BD

## 🚀 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/sensors` | Crear nuevo sensor |
| `GET` | `/api/sensors` | Obtener todos los sensores (con paginación) |
| `GET` | `/api/sensors/:id` | Obtener sensor por ID |
| `PUT` | `/api/sensors/:id` | Actualizar sensor |
| `DELETE` | `/api/sensors/:id` | Eliminar sensor |
| `GET` | `/api/sensors/stats/overview` | Obtener estadísticas |
| `GET` | `/api/sensors/range` | Obtener por rango de fechas |
| `GET` | `/api/sensors/latest` | Obtener datos más recientes |

## 📋 Requisitos

- Node.js (v14 o superior)
- MongoDB
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio:**
```bash
git clone <url-del-repositorio>
cd IOT-API
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp config.env.example config.env
# Editar config.env con tus credenciales
```

4. **Ejecutar la aplicación:**
```bash
npm start
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `config.env` con:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/iot_sensors
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Base de Datos

La API se conecta automáticamente a MongoDB usando la URI configurada.

## 📖 Uso de la API

### Crear un Sensor

```bash
curl -X POST http://localhost:3000/api/sensors \
  -H "Content-Type: application/json" \
  -d '{
    "temperatura": 25.5,
    "humedad": 60.0
  }'
```

### Obtener Sensores con Paginación

```bash
curl "http://localhost:3000/api/sensors?page=1&limit=10&sort=-fecha"
```

### Obtener Estadísticas

```bash
curl http://localhost:3000/api/sensors/stats/overview
```

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
npm test

# Ejecutar en modo desarrollo
npm run dev
```

## 📊 Ejemplo de Respuesta

```json
{
  "success": true,
  "message": "Datos obtenidos exitosamente",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "fecha": "2025-01-27T10:30:00.000Z",
      "temperatura": 25.5,
      "humedad": 60.0,
      "createdAt": "2025-01-27T10:30:00.000Z",
      "updatedAt": "2025-01-27T10:30:00.000Z"
    }
  ],
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

## 🔒 Seguridad

- **Validación de Entrada**: Todos los datos son validados antes de procesarse
- **Sanitización**: Los datos se limpian automáticamente
- **Rate Limiting**: Protección contra spam y ataques DDoS
- **Headers de Seguridad**: Implementados con Helmet
- **CORS**: Configuración segura para cross-origin requests

## 📈 Rendimiento

- **Paginación**: Resultados paginados para grandes volúmenes de datos
- **Índices**: Índices optimizados en MongoDB
- **Caching**: Preparado para implementar caché
- **Compresión**: Respuestas comprimidas automáticamente

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Si tienes preguntas o problemas:

- Abre un issue en GitHub
- Revisa la documentación en `docs/API.md`
- Contacta al equipo de desarrollo

## 🔄 Changelog

### v2.0.0 - Reorganización MCP
- ✅ Implementado patrón MCP completo
- ✅ Separación de responsabilidades
- ✅ Servicios de validación y respuesta
- ✅ Constantes centralizadas
- ✅ Documentación completa
- ✅ Middleware de validación mejorado

### v1.0.0 - Versión inicial
- ✅ CRUD básico de sensores
- ✅ API RESTful
- ✅ Conexión a MongoDB
- ✅ Validaciones básicas

---

**¡Disfruta usando la API de Sensores IoT! 🎉**
