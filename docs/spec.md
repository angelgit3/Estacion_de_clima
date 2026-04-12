# Especificaciones del Proyecto: Estación Meteorológica Pro

## 1. Visión General
Una estación meteorológica de alta fidelidad que combina hardware embebido (ESP32) y adquisición de datos profesional (NI MyDAQ).

## 2. Requerimientos de Hardware (ESP32)
- **MCU**: ESP32 / ESP32-C6.
- **Sensores**: BME280, DS3231, INMP441, Ky-003, MPU6500, LDR.
- **Energía**: 5V USB + Deep Sleep (30s).

## 3. Requerimientos de Software y Estética

### A. Dashboard (Next.js)
- **Tema**: **Tema Claro (Light Mode)**.
- **Estética**: "White Glassmorphism". Paneles blancos semi-transparentes, sombras suaves (soft shadows) y fondos con gradientes pasteles.
- **Gráficos**: Recharts con gradientes lineales y Tooltips personalizados.
- **Alertas**: Notificaciones visuales en rojo/ámbar si se detecta falla de integridad (`status: 'alert'`).

### B. Bridge (MyDAQ/Python)
- Captura de audio analógico -> Cálculo RMS -> Conversión a decibeles (`sound_level`).

## 4. Persistencia (Supabase)
- Tabla: `weather_logs`.
- Campos: `temperature`, `humidity`, `pressure`, `wind_speed`, `light_level`, `sound_level`, `status`.
