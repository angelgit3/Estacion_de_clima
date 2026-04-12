# Diseño Técnico: Estación Meteorológica Pro

## 1. Diseño Visual (Dashboard)
- **Modo**: Light / Claro.
- **Fondo**: Gradiente suave de `slate-50` a `slate-100`.
- **Componentes (Glassmorphism)**:
  - `bg-white/70`
  - `backdrop-blur-md`
  - `border border-white/20`
  - `shadow-lg` (suave).
- **Tipografía**: Inter o Outfit (Google Fonts).

## 2. Mapa de Pines (ESP32)
| Periférico | Pin(s) | Función |
|------------|--------|---------|
| I2C SDA    | 21     | BME280, DS3231, MPU6500 |
| I2C SCL    | 22     | BME280, DS3231, MPU6500 |
| I2S SCK    | 14     | INMP441 |
| I2S WS     | 15     | INMP441 |
| I2S SD     | 32     | INMP441 |
| Anemómetro | 33     | Interrupción por flanco |
| LDR        | 34     | Entrada Analógica |

## 3. Algoritmo de Sonido (Python)
- **Input**: AI0 (Analog Input 0) del MyDAQ.
- **Frecuencia**: 1000 Hz.
- **RMS**: Cálculo sobre 500ms de buffer.
- **Payload**: `{ "source": "mydaq", "sound_level": db_value }`.

## 4. Alerta de Seguridad
- El ESP32 monitorea el MPU6500.
- Si `sqrt(ax^2 + ay^2 + az^2)` supera un umbral de impacto o la inclinación cambia > 45°, se marca `status: 'alert'`.
