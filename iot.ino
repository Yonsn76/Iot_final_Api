#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <WiFiServer.h>
#include "DHT.h"
#include "time.h"

#define DHTPIN 4        // Pin donde está conectado el DHT22
#define DHTTYPE DHT22   // Tipo de sensor
DHT dht(DHTPIN, DHTTYPE);

// Configuración WiFi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Tu API
const char* serverName = "https://iotapi-production.up.railway.app/registros";

// Configuración de NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -5 * 3600;  // Perú GMT-5
const int daylightOffset_sec = 0;

// Servidor HTTP simple en puerto 80
WiFiServer server(80);

// Variables para control
unsigned long lastAutoSend = 0;
const unsigned long autoSendInterval = 60000; // 1 minuto

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado al WiFi!");
  Serial.print("IP del Arduino: ");
  Serial.println(WiFi.localIP());

  // Configurar NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  
  // Iniciar servidor HTTP
  server.begin();
  Serial.println("Servidor HTTP iniciado en puerto 80");
  Serial.println("Endpoint: http://" + WiFi.localIP().toString() + "/read");
}

String getFechaHora() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Error obteniendo hora NTP");
    return "1970-01-01 00:00:00";
  }
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

void readAndSendSensors() {
  Serial.println("🔄 Leyendo sensores por comando manual...");
  
  float temperatura = dht.readTemperature();
  float humedad = dht.readHumidity();

  if (!isnan(temperatura) && !isnan(humedad)) {
    Serial.printf("🌡️ Temperatura: %.2f°C, 💧 Humedad: %.2f%%\n", temperatura, humedad);
    
    // Enviar datos a la API
    bool success = sendDataToAPI(temperatura, humedad);
    
    if (success) {
      Serial.println("✅ Datos enviados exitosamente por comando manual");
    } else {
      Serial.println("❌ Error al enviar datos por comando manual");
    }
  } else {
    Serial.println("❌ Error al leer sensores DHT22");
  }
}

bool sendDataToAPI(float temperatura, float humedad) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado");
    return false;
  }
  
  HTTPClient http;
  String fechaHora = getFechaHora();

  // Crear JSON
  String jsonData = "{";
  jsonData += "\"fecha\":\"" + fechaHora + "\",";
  jsonData += "\"temperatura\":" + String(temperatura, 2) + ",";
  jsonData += "\"humedad\":" + String(humedad, 2);
  jsonData += "}";

  Serial.println("📤 Enviando datos: " + jsonData);

  http.begin(serverName);
  http.addHeader("Content-Type", "application/json");

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.printf("✅ Respuesta API: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("📥 Respuesta: " + response);
    http.end();
    return true;
  } else {
    Serial.printf("❌ Error en POST: %d\n", httpResponseCode);
    http.end();
    return false;
  }
}

void loop() {
  // Manejar peticiones HTTP del servidor
  WiFiClient client = server.available();
  if (client) {
    Serial.println("🌐 Cliente conectado");
    
    String request = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        request += c;
        
        if (c == '\n') {
          // Verificar si es una petición GET /read
          if (request.indexOf("GET /read") >= 0) {
            Serial.println("📡 Comando HTTP recibido: LEER SENSORES");
            
            // Leer sensores y enviar a API
            readAndSendSensors();
            
            // Responder al cliente
            client.println("HTTP/1.1 200 OK");
            client.println("Content-Type: text/plain");
            client.println("Access-Control-Allow-Origin: *");
            client.println();
            client.println("SENSORS_READ_SUCCESS");
            
            Serial.println("✅ Respuesta enviada al cliente");
          } else if (request.indexOf("GET /status") >= 0) {
            // Endpoint de estado
            client.println("HTTP/1.1 200 OK");
            client.println("Content-Type: application/json");
            client.println("Access-Control-Allow-Origin: *");
            client.println();
            
            String status = "{";
            status += "\"status\":\"online\",";
            status += "\"wifi\":\"" + WiFi.SSID() + "\",";
            status += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
            status += "\"uptime\":" + String(millis() / 1000) + ",";
            status += "\"last_auto_send\":" + String(lastAutoSend / 1000);
            status += "}";
            
            client.println(status);
          } else {
            // Petición no reconocida
            client.println("HTTP/1.1 404 Not Found");
            client.println("Content-Type: text/plain");
            client.println();
            client.println("Endpoint not found. Use /read or /status");
          }
          
          break;
        }
      }
    }
    
    client.stop();
    Serial.println("🌐 Cliente desconectado");
  }
  
  // Envío automático cada minuto
  if (WiFi.status() == WL_CONNECTED && (millis() - lastAutoSend) >= autoSendInterval) {
    Serial.println("⏰ Envío automático programado...");
    
    float temperatura = dht.readTemperature();
    float humedad = dht.readHumidity();

    if (!isnan(temperatura) && !isnan(humedad)) {
      sendDataToAPI(temperatura, humedad);
      lastAutoSend = millis();
    } else {
      Serial.println("❌ Error al leer sensores en envío automático");
    }
  }
  
  // Pequeño delay para estabilidad
  delay(100);
}
