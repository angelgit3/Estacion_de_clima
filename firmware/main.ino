/*
 * Estación Meteorológica Pro - Firmware ESP32
 * ============================================
 * Sensores: BME280 (T/H/P), DS3231 (RTC), MPU6500 (IMU),
 *           INMP441 (I2S Mic), KY-003 (Anemómetro), LDR.
 *
 * Ciclo: Deep Sleep 30s -> Leer sensores -> Enviar Supabase -> Dormir
 * Alerta: MPU6500 detecta sacudida/inclinación -> status: 'alert'
 *
 * Mapa de pines (design.md):
 *   I2C SDA=21, SCL=22  (BME280, DS3231, MPU6500)
 *   I2S SCK=14, WS=15, SD=32  (INMP441)
 *   Anemómetro=33 (interrupción)
 *   LDR=34 (analógico)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <RTClib.h>
#include <driver/i2s.h>
#include <esp_sleep.h>
#include <math.h>

// ============================================================
// --- CONFIGURACIÓN ---
// ============================================================
const char* ssid = "wawas";
const char* password = "463728195";
// ⚠️ IMPORTANTE: Reemplazar con las credenciales reales de tu proyecto Supabase
// Obtener en: https://supabase.com/dashboard/project/wayhuyteogutxqahdgla/settings/api
const char* supabase_url = "https://TU_PROJECT_ID.supabase.co/rest/v1/weather_logs";
const char* supabase_key = "TU_SUPABASE_ANON_KEY";

// ============================================================
// --- Mapa de Pines (design.md) ---
// ============================================================
#define I2C_SDA     21
#define I2C_SCL     22
#define I2S_SCK     14
#define I2S_WS      15
#define I2S_SD      32
#define WIND_PIN    33
#define LDR_PIN     34

// ============================================================
// --- MPU6500 (Detección de impacto) ---
// ============================================================
#define MPU6500_ADDR        0x68
#define MPU6500_ACCEL_XOUT_H 0x3B
#define MPU6500_PWR_MGMT_1   0x6B
#define MPU6500_ACCEL_CONFIG 0x1C
// Umbral: ~2g por eje = sacudida brusca (valor raw a +/-2g = 16384 LSB/g)
#define ACCEL_ALERT_THRESHOLD 25000  // ~1.5g combinados
// Umbral de inclinación: ~45° (1g * sin(45°) ≈ 11500 LSB en eje X o Y)
#define TILT_THRESHOLD  11500

// ============================================================
// --- Constantes Anemómetro ---
// ============================================================
// Cada revolución del anemómetro genera 1 pulso (KY-003 Hall effect)
// Factor de calibración: 1 pulso/segundo ≈ 2.4 km/h (ajustar según modelo)
const float WIND_FACTOR = 2.4;

// ============================================================
// --- Objetos ---
// ============================================================
Adafruit_BME280 bme;
RTC_DS3231 rtc;
volatile int wind_clicks = 0;

// ============================================================
// --- I2S Config (INMP441) ---
// ============================================================
static const i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = 16000,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 64,
    .use_apll = false
};

static const i2s_pin_config_t i2s_pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = -1,
    .data_in_num = I2S_SD
};

// ============================================================
// --- Interrupción Anemómetro ---
// ============================================================
void IRAM_ATTR countWind() {
    wind_clicks++;
}

// ============================================================
// --- MPU6500: Leer acelerómetro ---
// ============================================================
bool mpu6500_read_accel(int16_t *ax, int16_t *ay, int16_t *az) {
    Wire.beginTransmission(MPU6500_ADDR);
    Wire.write(MPU6500_ACCEL_XOUT_H);
    if (Wire.endTransmission(false) != 0) return false;
    if (Wire.requestFrom(MPU6500_ADDR, 6) != 6) return false;

    *ax = Wire.read() << 8 | Wire.read();
    *ay = Wire.read() << 8 | Wire.read();
    *az = Wire.read() << 8 | Wire.read();
    return true;
}

bool mpu6500_check_alert() {
    int16_t ax, ay, az;
    if (!mpu6500_read_accel(&ax, &ay, &az)) return false;

    // Magnitud del vector aceleración
    float magnitude = sqrt((float)ax * ax + (float)ay * ay + (float)az * az);

    // Detectar sacudida brusca
    if (magnitude > ACCEL_ALERT_THRESHOLD) return true;

    // Detectar inclinación > 45° (eje X o Y fuera de rango vertical)
    if (abs(ax) > TILT_THRESHOLD || abs(ay) > TILT_THRESHOLD) return true;

    return false;
}

void mpu6500_init() {
    Wire.beginTransmission(MPU6500_ADDR);
    Wire.write(MPU6500_PWR_MGMT_1);
    Wire.write(0); // Clear sleep bit
    Wire.endTransmission();
    delay(100);

    // Configurar rango acelerómetro: +/- 8g (AFS_SEL = 2 -> 4096 LSB/g)
    Wire.beginTransmission(MPU6500_ADDR);
    Wire.write(MPU6500_ACCEL_CONFIG);
    Wire.write(0x10); // AFS_SEL = 2
    Wire.endTransmission();
    delay(100);
}

// ============================================================
// --- Leer volumen I2S (INMP441) ---
// ============================================================
float read_i2s_volume() {
    size_t bytes_read = 0;
    int32_t samples[64];
    i2s_read(I2S_NUM_0, &samples, sizeof(samples), &bytes_read, pdMS_TO_TICKS(100));

    int num_samples = bytes_read / sizeof(int32_t);
    if (num_samples == 0) return 0.0;

    // Calcular RMS de las muestras
    float sum_sq = 0.0;
    for (int i = 0; i < num_samples; i++) {
        // Convertir 32-bit signed a float normalizado
        float val = (float)samples[i] / 2147483648.0;
        sum_sq += val * val;
    }
    float rms = sqrt(sum_sq / num_samples);

    // Convertir a escala logarítmica (dB relativo)
    // El +1e-6 evita log(0). Ajustar según calibración del micrófono.
    return 20.0 * log10(rms + 1e-6);
}

// ============================================================
// --- Enviar datos a Supabase ---
// ============================================================
void send_to_supabase(float temp, float hum, float pres,
                      float wind, float light, float sound,
                      const char* status) {
    if (WiFi.status() != WL_CONNECTED) return;

    HTTPClient http;
    http.begin(supabase_url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);
    http.addHeader("Prefer", "return=minimal");

    // Construir JSON manualmente (evitar dependencia de ArduinoJson)
    String json = "{";
    json += "\"source\":\"esp32\",";
    json += "\"temperature\":" + String(temp, 2) + ",";
    json += "\"humidity\":" + String(hum, 2) + ",";
    json += "\"pressure\":" + String(pres, 2) + ",";
    json += "\"wind_speed\":" + String(wind, 2) + ",";
    json += "\"light_level\":" + String(light, 2) + ",";
    json += "\"sound_level\":" + String(sound, 2) + ",";
    json += "\"status\":\"" + String(status) + "\"";
    json += "}";

    int httpCode = http.POST(json);
    if (httpCode == HTTP_CODE_CREATED || httpCode == 201) {
        Serial.println("[OK] Datos enviados a Supabase");
    } else {
        Serial.printf("[ERROR] HTTP %d - %s\n", httpCode, http.getString().c_str());
    }
    http.end();
}

// ============================================================
// --- SETUP ---
// ============================================================
void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\n=== Estación Meteorológica Pro ===");

    // --- I2C Bus (SDA=21, SCL=22) ---
    Wire.begin(I2C_SDA, I2C_SCL);

    // --- BME280 ---
    if (!bme.begin(0x76)) {
        Serial.println("[ERROR] BME280 no encontrado. Verificar cableado I2C.");
    } else {
        Serial.println("[OK] BME280 inicializado");
    }

    // --- DS3231 RTC ---
    if (!rtc.begin()) {
        Serial.println("[ERROR] DS3231 RTC no encontrado.");
    } else {
        Serial.println("[OK] DS3231 RTC inicializado");
        // Si el RTC perdió energía, se puede ajustar aquí:
        // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }

    // --- MPU6500 ---
    mpu6500_init();
    Serial.println("[OK] MPU6500 inicializado");

    // --- Anemómetro ---
    pinMode(WIND_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(WIND_PIN), countWind, FALLING);
    Serial.println("[OK] Anemómetro configurado (pin " + String(WIND_PIN) + ")");

    // --- I2S Mic ---
    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &i2s_pin_config);
    Serial.println("[OK] INMP441 I2S configurado");

    // --- WiFi ---
    Serial.print("Conectando a WiFi");
    WiFi.begin(ssid, password);
    int wifi_retries = 0;
    while (WiFi.status() != WL_CONNECTED && wifi_retries < 40) {
        delay(500);
        Serial.print(".");
        wifi_retries++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[OK] WiFi conectado - IP: " + WiFi.localIP().toString());
    } else {
        Serial.println("\n[ERROR] No se pudo conectar a WiFi. Volviendo a dormir.");
        esp_sleep_enable_timer_wakeup(30 * 1000000ULL); // 30 segundos
        esp_deep_sleep_start();
        return;
    }
}

// ============================================================
// --- LOOP PRINCIPAL (ejecutar una vez, luego deep sleep) ---
// ============================================================
void loop() {
    // 1. Obtener timestamp del RTC
    DateTime now;
    bool rtc_valid = false;
    if (rtc.begin()) {
        now = rtc.now();
        rtc_valid = now.isValid();
    }

    // 2. Leer BME280
    float temperature = bme.readTemperature();
    float humidity = bme.readHumidity();
    float pressure = bme.readPressure() / 100.0F; // hPa

    // 3. Leer LDR
    float light_level = (float)analogRead(LDR_PIN);

    // 4. Leer INMP441 (I2S)
    float sound_level = read_i2s_volume();

    // 5. Calcular velocidad del viento
    // wind_clicks cuenta pulsos desde el último ciclo.
    // Con ciclo de 30s: wind_speed = clicks * factor
    float wind_speed = (float)wind_clicks * WIND_FACTOR;
    wind_clicks = 0; // Reset para el próximo ciclo

    // 6. Verificar MPU6500 - Alerta de integridad
    bool alert = mpu6500_check_alert();
    const char* status = alert ? "alert" : "ok";

    // 7. Log por serial
    Serial.println("\n--- Lectura de Sensores ---");
    if (rtc_valid) {
        Serial.printf("Timestamp RTC: %04d-%02d-%02d %02d:%02d:%02d\n",
                      now.year(), now.month(), now.day(),
                      now.hour(), now.minute(), now.second());
    }
    Serial.printf("Temperatura: %.2f °C\n", temperature);
    Serial.printf("Humedad:     %.2f %%\n", humidity);
    Serial.printf("Presión:     %.2f hPa\n", pressure);
    Serial.printf("Viento:      %.2f km/h (%d clicks)\n", wind_speed, wind_clicks);
    Serial.printf("Luz (LDR):   %.0f\n", light_level);
    Serial.printf("Sonido (dB): %.2f\n", sound_level);
    Serial.printf("Status:      %s\n", status);

    // 8. Enviar a Supabase
    send_to_supabase(temperature, humidity, pressure,
                     wind_speed, light_level, sound_level, status);

    // 9. Deep Sleep por 30 segundos
    Serial.println("\nEntrando en Deep Sleep por 30 segundos...");
    Serial.flush();

    // Configurar wakeup por timer
    esp_sleep_enable_timer_wakeup(30 * 1000000ULL); // 30 segundos en microsegundos

    // Iniciar deep sleep (el ESP32 se reiniciará desde setup() al despertar)
    esp_deep_sleep_start();

    // Esta línea nunca se ejecuta
}
