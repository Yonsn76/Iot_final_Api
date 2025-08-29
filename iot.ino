#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"
#include "time.h"

#define DHTPIN 4        // Pin donde está conectado el DHT22
#define DHTTYPE DHT22   // Tipo de sensor
DHT dht(DHTPIN, DHTTYPE);

// Pines para los relés (cada relé controla un LED/actuador)
#define PIN_RELE_VENTILADOR  12
#define PIN_RELE_CALEFACTOR  13

// Configuración WiFi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Tu API local
const char* serverName = "https://iotapi.up.railway.app/api/sensors";

// Configuración de NTP
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = -5 * 3600;  // Perú GMT-5
const int daylightOffset_sec = 0;

// Variables para control de tiempo
unsigned long lastTime = 0;
const long interval = 10000; // 10 segundos en milisegundos

void setup() {
  Serial.begin(115200);
  Serial.println("¡Inicio correcto!"); // Línea extra para verificar el Serial Monitor

  // Inicializar DHT
  dht.begin();
  Serial.println("DHT22 inicializado");

  // Configurar pines de los relés como salida, y apagarlos al inicio
  pinMode(PIN_RELE_VENTILADOR, OUTPUT);
  pinMode(PIN_RELE_CALEFACTOR, OUTPUT);
  digitalWrite(PIN_RELE_VENTILADOR, LOW);
  digitalWrite(PIN_RELE_CALEFACTOR, LOW);

  // Conectar WiFi
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi...");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ Conectado al WiFi!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Fallo en la conexión WiFi");
  }

  // Configurar NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("⏰ Configurando NTP...");
  
  // Esperar a que se sincronice el tiempo
  int ntpAttempts = 0;
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo) && ntpAttempts < 10) {
    Serial.print(".");
    delay(1000);
    ntpAttempts++;
  }
  
  if (ntpAttempts < 10) {
    Serial.println("\n✅ Tiempo NTP sincronizado");
  } else {
    Serial.println("\n❌ Error sincronizando NTP");
  }
}


String getFechaHora() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("⚠️ Error obteniendo hora NTP, usando timestamp");
    return String(millis());
  }
  
  char buffer[25];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}


void enviarDatos() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado, reconectando...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  
  // Leer sensores
  float temperatura = dht.readTemperature();
  float humedad = dht.readHumidity();

  // Verificar lectura de sensores
  if (isnan(temperatura) || isnan(humedad)) {
    Serial.println("❌ Error al leer el DHT22");
    Serial.print("Temperatura: ");
    Serial.println(temperatura);
    Serial.print("Humedad: ");
    Serial.println(humedad);
    
    // Apaga ambos relés si la lectura falla
    digitalWrite(PIN_RELE_VENTILADOR, LOW);
    digitalWrite(PIN_RELE_CALEFACTOR, LOW);
    return;
  }

  // Mostrar lecturas en Serial
  Serial.println("📊 Lecturas de sensores:");
  Serial.print("🌡️ Temperatura: ");
  Serial.print(temperatura);
  Serial.println("°C");
  Serial.print("💧 Humedad: ");
  Serial.print(humedad);
  Serial.println("%");

  String fechaHora = getFechaHora();

  // Crear JSON mejorado
  String jsonData = "{";
  jsonData += "\"temperatura\":" + String(temperatura, 2) + ",";
  jsonData += "\"humedad\":" + String(humedad, 2) + ",";
  
  // Determinar estado basado en temperatura
  String estado = "normal";
  String actuador = "ninguno";
  
  if (temperatura > 30) {
    estado = "caliente";
    actuador = "ventilador";
  } else if (temperatura < 20) {
    estado = "frio";
    actuador = "calefactor";
  }
  
  if (humedad > 80) {
    estado = "humedo";
    actuador = "deshumidificador";
  } else if (humedad < 30) {
    estado = "seco";
    actuador = "humidificador";
  }
  
  jsonData += "\"estado\":\"" + estado + "\",";
  jsonData += "\"actuador\":\"" + actuador + "\"";
  jsonData += "}";

  Serial.println("📤 Enviando datos a la API:");
  Serial.println(jsonData);

  // --- AQUÍ CONTROLAS LOS RELÉS SEGÚN EL ACTUADOR ---
  if (actuador == "ventilador") {
    digitalWrite(PIN_RELE_VENTILADOR, HIGH);
    digitalWrite(PIN_RELE_CALEFACTOR, LOW);
  } else if (actuador == "calefactor") {
    digitalWrite(PIN_RELE_VENTILADOR, LOW);
    digitalWrite(PIN_RELE_CALEFACTOR, HIGH);
  } else {
    digitalWrite(PIN_RELE_VENTILADOR, LOW);
    digitalWrite(PIN_RELE_CALEFACTOR, LOW);
  }
  // ---------------------------------------------------

  // Configurar HTTP
  http.begin(serverName);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 segundos de timeout

  // Enviar POST
  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.print("✅ Respuesta API: ");
    Serial.println(httpResponseCode);
    
    String response = http.getString();
    Serial.println("📥 Respuesta completa:");
    Serial.println(response);
    
    // Parsear respuesta si es necesario
    if (httpResponseCode == 201 || httpResponseCode == 200) {
      Serial.println("🎉 Datos enviados exitosamente!");
    }
  } else {
    Serial.print("❌ Error en POST: ");
    Serial.println(httpResponseCode);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }

  http.end();
}

void loop() {
  unsigned long currentTime = millis();
  
  // Enviar datos cada intervalo (10s)
  if (currentTime - lastTime >= interval) {
    enviarDatos();
    lastTime = currentTime;
    
    // Mostrar estado del WiFi
    Serial.print("📡 Estado WiFi: ");
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Conectado");
      Serial.print("📶 Señal: ");
      Serial.print(WiFi.RSSI());
      Serial.println(" dBm");
    } else {
      Serial.println("Desconectado");
    }
    
    Serial.println("⏳ Esperando próximo envío...");
    Serial.println("----------------------------------------");
  }
  
  // Pequeño delay para estabilidad
  delay(100);
}
