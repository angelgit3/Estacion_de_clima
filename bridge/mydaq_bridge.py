"""
Estación Meteorológica Pro - Bridge MyDAQ
==========================================
Captura audio analógico del micrófono electret via NI MyDAQ.
Calcula el nivel de presión sonora en decibeles (RMS).
Envía el valor a Supabase cada 30 segundos.

Spec: AI0, 1000 Hz, RMS sobre buffer de 500ms.
"""

import os
import nidaqmx
import time
import requests
import math

# ============================================================
# --- CONFIGURACIÓN ---
# ============================================================
# ⚠️ IMPORTANTE: Configurar variables de entorno o reemplazar valores
# Obtener en: https://supabase.com/dashboard/project/wayhuyteogutxqahdgla/settings/api
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://TU_PROJECT_ID.supabase.co/rest/v1/weather_logs")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "TU_SUPABASE_ANON_KEY")
CHANNEL = "myDAQ1/ai0"  # Ajustar según el nombre en NI MAX

SAMPLE_RATE = 1000          # Hz (según design.md)
BUFFER_DURATION_MS = 500    # 500ms de buffer para RMS
SEND_INTERVAL_S = 30        # Enviar cada 30 segundos

# Referencia de calibración (voltaje de referencia para 0 dB SPL)
# Un micrófono electret típico produce ~1-10mV RMS en ambiente silencioso.
# Ajustar este valor según calibración con sonómetro de referencia.
VOLTAGE_REF = 0.001  # 1 mV como referencia base


def calculate_spl_db(samples):
    """
    Calcula el nivel de presión sonora en dB a partir de muestras de voltaje.

    Algoritmo (design.md):
      1. Calcular RMS del buffer de 500ms
      2. Convertir a dB: 20 * log10(RMS / V_REF)
    """
    if not samples or len(samples) == 0:
        return 0.0

    # RMS (Root Mean Square)
    sum_sq = sum(x * x for x in samples)
    rms = math.sqrt(sum_sq / len(samples))

    # Evitar log(0) con un floor mínimo
    if rms < 1e-9:
        return 0.0

    # dB SPL relativo (referenciado al voltaje de calibración)
    db = 20.0 * math.log10(rms / VOLTAGE_REF)

    # Clamp a rango razonable (0-140 dB SPL típico)
    return max(0.0, min(140.0, db))


def send_to_supabase(sound_level):
    """Envía una lectura de sound_level a Supabase."""
    headers = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=minimal"
    }
    payload = {
        "source": "mydaq",
        "sound_level": round(sound_level, 2)
    }

    try:
        response = requests.post(SUPABASE_URL, headers=headers, json=payload)
        if response.status_code in (200, 201):
            ts = time.strftime('%H:%M:%S')
            print(f"[{ts}] Enviado: {sound_level:.2f} dB (HTTP {response.status_code})")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Fallo de red: {e}")


def main():
    print("=" * 50)
    print("  Estación Meteorológica Pro - Bridge MyDAQ")
    print("=" * 50)
    print(f"Canal:      {CHANNEL}")
    print(f"Sample Rate: {SAMPLE_RATE} Hz")
    print(f"Buffer RMS:  {BUFFER_DURATION_MS} ms")
    print(f"Envío cada:  {SEND_INTERVAL_S} s")
    print("-" * 50)

    try:
        with nidaqmx.Task() as task:
            task.ai_channels.add_ai_voltage_chan(CHANNEL)

            last_send_time = time.time()

            while True:
                # Calcular cuántas muestras necesitamos para 500ms
                samples_needed = int(SAMPLE_RATE * BUFFER_DURATION_MS / 1000)

                # Leer el buffer completo de 500ms
                samples = []
                start_read = time.time()
                while len(samples) < samples_needed:
                    remaining = samples_needed - len(samples)
                    readings = task.read(number_of_samples_per_channel=remaining)
                    if isinstance(readings, list):
                        samples.extend(readings)
                    else:
                        samples.append(readings)

                # Calcular SPL en dB
                spl_db = calculate_spl_db(samples)
                ts = time.strftime('%H:%M:%S')
                print(f"[{ts}] SPL: {spl_db:.2f} dB ({len(samples)} muestras)")

                # Enviar si pasó el intervalo
                now = time.time()
                if now - last_send_time >= SEND_INTERVAL_S:
                    send_to_supabase(spl_db)
                    last_send_time = now

    except nidaqmx.DaqError as e:
        print(f"\nError de NI-DAQmx: {e}")
    except KeyboardInterrupt:
        print("\nCaptura detenida por el usuario.")
    except Exception as e:
        print(f"\nError inesperado: {e}")


if __name__ == "__main__":
    main()
