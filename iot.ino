#include "DHT.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";           // Cambia por tu SSID de WiFi
const char* password = "TU_WIFI_PASSWORD";    // Cambia por tu contraseña de WiFi

// Configuración de la API
const char* apiUrl = "http://192.168.1.100:3000/api/sensors";  // Cambia por la IP de tu servidor
const int apiPort = 3000;

// Configuración NTP (Network Time Protocol)
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -18000;  // GMT-5 para México (ajusta según tu zona horaria)
const int daylightOffset_sec = 0;   // Sin horario de verano

// Configuración de pines
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define RELAY_CALEFACTOR_PIN 2    // Pin para el relay del calefactor
#define RELAY_VENTILADOR_PIN 15   // Pin para el relay del ventilador
#define LED_CALEFACTOR_PIN 5      // LED VERDE - representa calefactor encendido
#define LED_NORMAL_PIN 18         // LED AMARILLO - representa temperatura normal
#define LED_VENTILADOR_PIN 19     // LED ROJO - representa ventilador encendido
#define LED_WIFI_PIN 21           // LED para indicar estado de WiFi

// Umbrales de temperatura
#define TEMP_BAJA 18.0      // Temperatura por debajo de la cual se enciende el calefactor
#define TEMP_ALTA 28.0      // Temperatura por encima de la cual se enciende el ventilador
#define TEMP_NORMAL_MIN 20.0 // Límite inferior de temperatura normal
#define TEMP_NORMAL_MAX 26.0 // Límite superior de temperatura normal

DHT dht(DHT_PIN, DHT_TYPE);

// Variables para el envío de datos
unsigned long lastApiCall = 0;
const unsigned long apiCallInterval = 30000;  // Enviar datos cada 30 segundos
int sensorId = 1;

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Configurar pines
  pinMode(RELAY_CALEFACTOR_PIN, OUTPUT);
  pinMode(RELAY_VENTILADOR_PIN, OUTPUT);
  pinMode(LED_CALEFACTOR_PIN, OUTPUT);    // LED Verde = Calefactor
  pinMode(LED_NORMAL_PIN, OUTPUT);         // LED Amarillo = Normal
  pinMode(LED_VENTILADOR_PIN, OUTPUT);    // LED Rojo = Ventilador
  pinMode(LED_WIFI_PIN, OUTPUT);
  
  // Inicializar actuadores apagados
  digitalWrite(RELAY_CALEFACTOR_PIN, LOW);
  digitalWrite(RELAY_VENTILADOR_PIN, LOW);
  
  // Inicializar LEDs apagados
  digitalWrite(LED_CALEFACTOR_PIN, LOW);
  digitalWrite(LED_NORMAL_PIN, LOW);
  digitalWrite(LED_VENTILADOR_PIN, LOW);
  digitalWrite(LED_WIFI_PIN, LOW);
  
  Serial.println("ESP32 Temperature Control System with Visual Actuator Indicators");
  Serial.println("LED VERDE = Calefactor | LED AMARILLO = Normal | LED ROJO = Ventilador");
  
  // Conectar a WiFi
  connectToWiFi();
  
  // Configurar tiempo NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Esperar a que se sincronice el tiempo
  Serial.println("Sincronizando tiempo con servidor NTP...");
  while (!time(nullptr)) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println();
  
  // Mostrar tiempo actual
  printLocalTime();
}

void loop() {
  // Leer sensores
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Mostrar lecturas en Serial
  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.print("%  Temperature: ");
  Serial.print(temperature);
  Serial.println("°C");
  
  // Control automático de clima
  String estado = determineEstado(temperature);
  String actuador = controlClimate(temperature);
  
  // Control de LEDs representativos
  controlLEDs(estado, actuador);
  
  // Enviar datos a la API cada cierto tiempo
  if (millis() - lastApiCall >= apiCallInterval) {
    sendDataToAPI(temperature, humidity, estado, actuador);
    lastApiCall = millis();
  }
  
  // Esperar 2 segundos antes de la siguiente lectura
  delay(2000);
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_WIFI_PIN, !digitalRead(LED_WIFI_PIN)); // Parpadear LED WiFi
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  digitalWrite(LED_WIFI_PIN, HIGH); // LED WiFi fijo cuando está conectado
}

void printLocalTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  
  char timeString[64];
  strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", &timeinfo);
  Serial.print("Tiempo actual: ");
  Serial.println(timeString);
}

String getCurrentDateTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "";
  }
  
  char timeString[64];
  strftime(timeString, sizeof(timeString), "%Y-%m-%dT%H:%M:%S.000Z", &timeinfo);
  return String(timeString);
}

String determineEstado(float temperature) {
  if (temperature < TEMP_NORMAL_MIN) {
    return "bajo";
  } else if (temperature >= TEMP_NORMAL_MIN && temperature <= TEMP_NORMAL_MAX) {
    return "normal";
  } else {
    return "alto";
  }
}

String controlClimate(float temperature) {
  // Apagar ambos actuadores primero
  digitalWrite(RELAY_CALEFACTOR_PIN, LOW);
  digitalWrite(RELAY_VENTILADOR_PIN, LOW);
  
  if (temperature < TEMP_BAJA) {
    // Temperatura muy baja - encender calefactor
    digitalWrite(RELAY_CALEFACTOR_PIN, HIGH);
    Serial.println("🔥 CALEFACTOR ON - Temperatura muy baja");
    return "calefactor";
  } else if (temperature > TEMP_ALTA) {
    // Temperatura muy alta - encender ventilador
    digitalWrite(RELAY_VENTILADOR_PIN, HIGH);
    Serial.println("💨 VENTILADOR ON - Temperatura muy alta");
    return "ventilador";
  } else {
    // Temperatura normal - no actuador
    Serial.println("✅ Sin actuador - Temperatura normal");
    return "ninguno";
  }
}

void controlLEDs(String estado, String actuador) {
  // Apagar todos los LEDs primero
  digitalWrite(LED_CALEFACTOR_PIN, LOW);
  digitalWrite(LED_NORMAL_PIN, LOW);
  digitalWrite(LED_VENTILADOR_PIN, LOW);
  
  // Encender LED según el actuador activo
  if (actuador == "calefactor") {
    digitalWrite(LED_CALEFACTOR_PIN, HIGH);    // LED VERDE = Calefactor
    Serial.println("🟢 LED VERDE ON - Calefactor activo");
  } else if (actuador == "ventilador") {
    digitalWrite(LED_VENTILADOR_PIN, HIGH);    // LED ROJO = Ventilador
    Serial.println("🔴 LED ROJO ON - Ventilador activo");
  } else {
    digitalWrite(LED_NORMAL_PIN, HIGH);        // LED AMARILLO = Normal
    Serial.println("🟡 LED AMARILLO ON - Temperatura normal");
  }
}

void sendDataToAPI(float temperature, float humidity, String estado, String actuador) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Attempting to reconnect...");
    connectToWiFi();
    return;
  }
  
  HTTPClient http;
  
  // Crear JSON con los datos del sensor
  StaticJsonDocument<400> doc;
  doc["temperatura"] = round(temperature * 100) / 100.0;  // Redondear a 2 decimales
  doc["humedad"] = round(humidity * 100) / 100.0;         // Redondear a 2 decimales
  doc["estado"] = estado;
  doc["actuador"] = actuador;
  doc["fecha"] = getCurrentDateTime();  // Fecha y hora actual
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("📡 Sending data to API: ");
  Serial.println(jsonString);
  
  // Configurar la petición HTTP
  http.begin(apiUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Realizar petición POST
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("✅ HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("📨 Response: ");
    Serial.println(response);
    
    // Parpadear LED correspondiente al actuador activo si el envío fue exitoso
    if (actuador == "calefactor") {
      digitalWrite(LED_CALEFACTOR_PIN, LOW);
      delay(100);
      digitalWrite(LED_CALEFACTOR_PIN, HIGH);
    } else if (actuador == "ventilador") {
      digitalWrite(LED_VENTILADOR_PIN, LOW);
      delay(100);
      digitalWrite(LED_VENTILADOR_PIN, HIGH);
    } else {
      digitalWrite(LED_NORMAL_PIN, LOW);
      delay(100);
      digitalWrite(LED_NORMAL_PIN, HIGH);
    }
    
  } else {
    Serial.print("❌ Error code: ");
    Serial.println(httpResponseCode);
    Serial.print("🚨 Error: ");
    Serial.println(http.errorToString(httpResponseCode));
    
    // Parpadear todos los LEDs si hubo error
    digitalWrite(LED_CALEFACTOR_PIN, HIGH);
    digitalWrite(LED_NORMAL_PIN, HIGH);
    digitalWrite(LED_VENTILADOR_PIN, HIGH);
    delay(200);
    digitalWrite(LED_CALEFACTOR_PIN, LOW);
    digitalWrite(LED_NORMAL_PIN, LOW);
    digitalWrite(LED_VENTILADOR_PIN, LOW);
  }
  
  http.end();
}

// Función para verificar la conexión WiFi periódicamente
void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    digitalWrite(LED_WIFI_PIN, LOW);
    connectToWiFi();
  }
}