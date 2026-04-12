# Estación Meteorológica Pro

Estación meteorológica de alta fidelidad que combina hardware embebido (ESP32) con adquisición de datos profesional (NI MyDAQ) y un dashboard web en tiempo real.

**Ubicación:** Sierra Hidalguense, México (20°04'46.3"N 98°22'06.7"W)

---

## 📁 Estructura del Proyecto

```
├── firmware/          # Código ESP32 (Arduino IDE)
├── bridge/            # Puente MyDAQ → Supabase (Python)
├── dashboard/         # Dashboard web (Next.js + Recharts)
├── seeds/             # Script de siembra de datos reales (Open-Meteo)
├── docs/              # Especificaciones y diseño técnico
└── schema.sql         # Esquema de base de datos
```

---

## 🔧 Arquitectura

### Firmware ESP32 (`firmware/main.ino`)
El ESP32 despierta cada **30 segundos**, lee todos los sensores y envía los datos a Supabase.

| Sensor | Función | Bus |
|--------|---------|-----|
| **BME280** | Temperatura, Humedad, Presión | I2C (21/22) |
| **MPU6500** | Detección de sacudidas/inclinación | I2C (21/22) |
| **DS3231** | Reloj de tiempo real | I2C (21/22) |
| **INMP441** | Micrófono digital I2S | I2S (14/15/32) |
| **KY-003** | Anemómetro (efecto Hall) | Interrupción (33) |
| **LDR** | Fotoresistencia (luz ambiente) | ADC (34) |

**Mapa de pines completo:**
- I2C SDA = 21, I2C SCL = 22 (sensores I2C compartidos)
- I2S SCK = 14, WS = 15, SD = 32 (INMP441)
- Anemómetro = 33 (interrupción flanco de bajada)
- LDR = 34 (entrada analógica)

**Detección de integridad:** Si el MPU6500 detecta una sacudida brusca o una inclinación mayor a 45°, envía `status: 'alert'` para notificación visual en el dashboard.

### Bridge MyDAQ (`bridge/mydaq_bridge.py`)
Captura audio analógico del micrófono electret vía NI MyDAQ:
- Canal: AI0 (voltaje)
- Frecuencia de muestreo: 1000 Hz
- Cálculo RMS sobre buffer de 500ms
- Conversión a decibeles SPL relativo
- Envío a Supabase cada 30 segundos

### Dashboard (`dashboard/`)
Aplicación Next.js con estética **White Glassmorphism**:
- Fondo gradiente `slate-50` a `slate-100`
- Tarjetas translúcidas `bg-white/70` con `backdrop-blur-md`
- **6 tarjetas de sensores**: temperatura, humedad, presión, viento, luz, sonido
- **3 gráficas** con gradientes lineales vibrantes (Recharts)
- **Realtime** vía Supabase WebSockets
- **Alertas visuales**: banner rojo pulsante cuando se detecta `status: 'alert'`

### Base de Datos (Supabase)
Proyecto: **Estación Meteorológica** (`wayhuyteogutxqahdgla`)
- Tabla `weather_logs` con RLS habilitado
- Política de lectura pública + inserción abierta
- Índice en `created_at DESC` para consultas rápidas

### Seed de Datos Reales (`seeds/seed_data.py`)
Obtiene datos históricos reales de la API de **Open-Meteo** (sin API key) para las coordenadas de la estación e interpola a intervalos de 15 minutos:
- Temperatura real (6°C – 26°C)
- Humedad real (21% – 100%)
- Presión real (~1010 – 1023 hPa, a 2157m de altitud)
- Viento real (0.9 – 22.6 km/h)
- Luz derivada de radiación solar real
- Sonido realista según hora del día

---

## 🚀 Inicio Rápido

### Dashboard
```bash
cd dashboard
npm install
npm run dev
```
Abre http://localhost:3000

### Bridge MyDAQ
```bash
pip install nidaqmx requests
python bridge/mydaq_bridge.py
```

### Sembrar datos reales
```bash
pip install requests
python seeds/seed_data.py
```

### Firmware ESP32
1. Abre `firmware/main.ino` en Arduino IDE
2. Instala las librerías: Adafruit BME280, RTClib
3. Configura tu WiFi y claves de Supabase (ya incluidas)
4. Sube al ESP32

---

## 🔑 Credenciales

**⚠️ Las credenciales NO se almacenan en el repositorio.** Se usan archivos de ejemplo:

| Archivo | Variables |
|---------|-----------|
| `dashboard/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `.env` (raíz) | `SUPABASE_URL`, `SUPABASE_KEY` |
| `firmware/main.ino` | Editar `supabase_url` y `supabase_key` directamente |

Obtener las claves en: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/wayhuyteogutxqahdgla/settings/api)

### Setup rápido de credenciales
```bash
# Dashboard
cp dashboard/.env.example dashboard/.env.local
# Editar .env.local con tus claves reales

# Bridge y Seeds
cp .env.example .env
# Editar .env con tus claves reales

# Firmware
# Editar firmware/main.ino y reemplazar TU_PROJECT_ID y TU_SUPABASE_ANON_KEY
```

---

## 📝 Estado Actual

- [x] Proyecto Supabase creado y configurado
- [x] Tabla `weather_logs` con RLS
- [x] Seed con datos reales de Open-Meteo (1340 registros)
- [x] Dashboard con White Glassmorphism + Realtime + Alertas
- [x] Firmware ESP32 completo (MPU6500, deep sleep, alertas)
- [x] Bridge MyDAQ con cálculo SPL
- [ ] Hardware conectado y enviando datos en vivo
- [ ] Despliegue del dashboard a Vercel/Netlify

---

## 🌐 Tecnologías

| Capa | Tecnología |
|------|-----------|
| **Hardware** | ESP32, BME280, MPU6500, DS3231, INMP441, KY-003, LDR |
| **Backend** | Supabase (PostgreSQL + Realtime + REST API) |
| **Datos externos** | Open-Meteo API (datos meteorológicos reales) |
| **Adquisición** | NI MyDAQ + Python + nidaqmx |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Visualización** | Recharts 3 con linear gradients |
| **Animación** | Framer Motion |
| **Iconos** | Lucide React |
