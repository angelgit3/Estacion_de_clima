-- Esquema para la Estación Meteorológica Pro

-- 1. Crear la tabla de logs
CREATE TABLE IF NOT EXISTS weather_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    source TEXT NOT NULL, -- 'esp32' o 'mydaq'
    
    -- Lecturas de ambiente (ESP32)
    temperature FLOAT,
    humidity FLOAT,
    pressure FLOAT,
    
    -- Lecturas de viento (ESP32)
    wind_speed FLOAT,
    
    -- Lecturas de luz (ESP32)
    light_level FLOAT,
    
    -- Lecturas de sonido (ESP32 / MyDAQ)
    sound_level FLOAT, -- Decibelios o nivel relativo

    -- Estado de integridad (MPU6500)
    status TEXT DEFAULT 'ok' -- 'ok' o 'alert'
);

-- 2. Habilitar RLS
ALTER TABLE weather_logs ENABLE ROW LEVEL SECURITY;

-- 3. Crear política de lectura pública (para el Dashboard)
CREATE POLICY "Lectura pública de logs" 
ON weather_logs FOR SELECT 
USING (true);

-- 4. Crear política de inserción con clave anónima
CREATE POLICY "Inserción permitida" 
ON weather_logs FOR INSERT 
WITH CHECK (true);

-- 5. Crear índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_weather_logs_created_at ON weather_logs(created_at DESC);
