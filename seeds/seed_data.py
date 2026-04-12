"""
Seed de datos reales para la Estación Meteorológica Pro.
=========================================================
Obtiene datos históricos reales de Open-Meteo API para las coordenadas:
    20°04'46.3"N 98°22'06.7"W  (Sierra Hidalguense, México)

Variables reales: temperatura, humedad, presión, viento, radiación solar.
Variables simuladas: sound_level (realista según hora del día).
"""

import requests
import datetime
import random
import math
import time

# ============================================================
# --- CONFIGURACIÓN ---
# ============================================================
SUPABASE_URL = "https://wayhuyteogutxqahdgla.supabase.co/rest/v1/weather_logs"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndheWh1eXRlb2d1dHhxYWhkZ2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDkzMjIsImV4cCI6MjA5MTUyNTMyMn0.MYbiIW3JBf_K4C_2ZP1pHSW-MZfoDtADch_fdEbkD48"

LAT = 20.0795    # 20°04'46.3"N
LON = -98.3685   # 98°22'06.7"W
PAST_DAYS = 7    # Últimos 7 días

# Open-Meteo API (gratis, sin API key)
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_real_weather_data():
    """Obtiene datos reales de Open-Meteo para los últimos N días."""
    params = {
        "latitude": LAT,
        "longitude": LON,
        "hourly": "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,shortwave_radiation,is_day",
        "past_days": PAST_DAYS,
        "timezone": "America/Mexico_City"
    }

    response = requests.get(OPEN_METEO_URL, params=params)
    response.raise_for_status()
    return response.json()


def interpolate_hourly_to_interval(hourly_data, interval_minutes=15):
    """
    Interpola datos horarios a intervalos más pequeños.
    Usa interpolación lineal entre puntos horarios adyacentes.
    """
    times = hourly_data["time"]
    temps = hourly_data["temperature_2m"]
    hums = hourly_data["relative_humidity_2m"]
    pressures = hourly_data["pressure_msl"]
    winds = hourly_data["wind_speed_10m"]
    radiation = hourly_data["shortwave_radiation"]
    is_day = hourly_data["is_day"]

    interpolated = []
    intervals_per_hour = 60 // interval_minutes

    for i in range(len(times) - 1):
        # Valores actuales y siguientes
        t0 = temps[i]
        t1 = temps[i + 1]
        h0 = hums[i]
        h1 = hums[i + 1]
        p0 = pressures[i]
        p1 = pressures[i + 1]
        w0 = winds[i]
        w1 = winds[i + 1]
        r0 = radiation[i]
        r1 = radiation[i + 1]
        d0 = is_day[i]
        d1 = is_day[i + 1]

        for j in range(intervals_per_hour):
            frac = j / intervals_per_hour

            # Interpolación lineal + variación sensor realista
            temp = t0 + (t1 - t0) * frac + random.uniform(-0.3, 0.3)
            hum = h0 + (h1 - h0) * frac + random.uniform(-1.0, 1.0)
            pres = p0 + (p1 - p0) * frac + random.uniform(-0.2, 0.2)
            wind = max(0, w0 + (w1 - w0) * frac + random.uniform(-0.5, 0.5))
            rad = max(0, r0 + (r1 - r0) * frac + random.uniform(-5, 5))
            day = 1 if (d0 + d1) > 0 else 0  # Si al menos uno es día

            # Calcular hora local para sound_level realista
            dt = datetime.datetime.fromisoformat(times[i])
            dt = dt + datetime.timedelta(minutes=j * interval_minutes)
            hour = dt.hour

            # Light level: derivado de radiación solar (W/m² -> escala LDR 0-4095)
            # LDR típico: 0 (oscuridad) a ~4095 (sol directo)
            light_level = max(0, min(4095, int(rad * 3.5 + random.uniform(-20, 20))))
            if day == 0:
                light_level = random.randint(0, 50)  # Muy bajo de noche

            # Sound level realista (Open-Meteo no tiene audio)
            # Sierra Hidalguense: zonas rurales, más ruido en horas laborales
            if 6 <= hour <= 8:
                sound = random.uniform(45, 60)    # Mañana: aves, actividad
            elif 9 <= hour <= 17:
                sound = random.uniform(50, 72)    # Día: actividad humana
            elif 18 <= hour <= 20:
                sound = random.uniform(40, 58)    # Tarde: transición
            elif 21 <= hour <= 23:
                sound = random.uniform(30, 45)    # Noche: más silencioso
            else:  # 0-5
                sound = random.uniform(22, 38)    # Madrugada: muy silencioso

            # Determinar source: esp32 lee todo, mydaq solo sonido
            source = "esp32"

            # Timestamp ISO
            created_at = dt.isoformat()

            interpolated.append({
                "created_at": created_at,
                "source": source,
                "temperature": round(temp, 2),
                "humidity": round(max(0, min(100, hum)), 2),
                "pressure": round(pres, 2),
                "wind_speed": round(wind, 2),
                "light_level": round(light_level, 2),
                "sound_level": round(sound, 2),
                "status": "ok"
            })

    return interpolated


def send_to_supabase(batch):
    """Envía un lote de datos a Supabase."""
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=minimal"
    }

    response = requests.post(SUPABASE_URL, headers=headers, json=batch)
    return response.status_code


def main():
    print("=" * 60)
    print("  Seed Realista - Estación Meteorológica Pro")
    print(f"  Coordenadas: {LAT}°N, {LON}°W")
    print(f"  Últimos {PAST_DAYS} días (datos reales de Open-Meteo)")
    print("=" * 60)

    # 1. Obtener datos reales
    print("\n[1/3] Obteniendo datos reales de Open-Meteo...")
    weather_data = fetch_real_weather_data()
    hourly = weather_data.get("hourly", {})
    total_hours = len(hourly.get("time", []))
    print(f"      {total_hours} horas de datos reales obtenidos")

    # 2. Interpolar a intervalos de 15 minutos
    print("\n[2/3] Interpolando a intervalos de 15 minutos...")
    records = interpolate_hourly_to_interval(hourly, interval_minutes=15)
    print(f"      {len(records)} registros generados")

    # Resumen de datos reales
    temps = [r["temperature"] for r in records]
    print(f"      Temperatura real: {min(temps):.1f}°C - {max(temps):.1f}°C")
    print(f"      Presión real: {min(r['pressure'] for r in records):.1f} - {max(r['pressure'] for r in records):.1f} hPa")
    print(f"      Viento real: {min(r['wind_speed'] for r in records):.1f} - {max(r['wind_speed'] for r in records):.1f} km/h")

    # 3. Enviar a Supabase en lotes
    print("\n[3/3] Enviando a Supabase...")
    batch_size = 50
    total_sent = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        status_code = send_to_supabase(batch)

        if status_code in (200, 201):
            total_sent += len(batch)
            dt_label = batch[-1]["created_at"][:16]
            print(f"      Lote enviado: {dt_label} ({total_sent}/{len(records)})")
        else:
            print(f"      Error en lote {i // batch_size}: HTTP {status_code}")

    print("\n" + "=" * 60)
    print(f"  ✅ {total_sent} registros sembrados con datos reales")
    print("=" * 60)


if __name__ == "__main__":
    main()
