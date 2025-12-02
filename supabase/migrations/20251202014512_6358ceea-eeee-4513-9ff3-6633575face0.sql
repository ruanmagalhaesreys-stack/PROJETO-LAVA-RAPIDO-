-- Add vehicle_type column to service_prices
ALTER TABLE public.service_prices 
ADD COLUMN IF NOT EXISTS vehicle_type text NOT NULL DEFAULT 'SEDAN';

-- Drop old unique constraint
ALTER TABLE public.service_prices 
DROP CONSTRAINT IF EXISTS service_prices_user_id_service_name_key;

-- Create new unique constraint with vehicle_type
ALTER TABLE public.service_prices 
ADD CONSTRAINT service_prices_user_id_service_name_vehicle_type_key 
UNIQUE (user_id, service_name, vehicle_type);

-- Add vehicle_type column to daily_services (nullable for existing records)
ALTER TABLE public.daily_services 
ADD COLUMN IF NOT EXISTS vehicle_type text;

-- Drop and recreate the initialize_service_prices function with new structure
DROP FUNCTION IF EXISTS public.initialize_service_prices(uuid);

CREATE OR REPLACE FUNCTION public.initialize_service_prices(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- MOTO prices (0.5x base)
  INSERT INTO public.service_prices (user_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, 'Lavagem Completa', 'MOTO', 40.00),
    (p_user_id, 'Lavagem Interna', 'MOTO', 25.00),
    (p_user_id, 'Lavagem Externa', 'MOTO', 20.00),
    (p_user_id, 'Lavagem Completa + Cera', 'MOTO', 50.00),
    (p_user_id, 'Lavagem Motor', 'MOTO', 15.00),
    (p_user_id, 'Lavagem Externa + Cera', 'MOTO', 30.00),
    (p_user_id, 'Vitrificação', 'MOTO', 150.00),
    (p_user_id, 'Hidratação de Bancos', 'MOTO', 75.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO NOTHING;

  -- RET prices (0.8x base)
  INSERT INTO public.service_prices (user_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, 'Lavagem Completa', 'RET', 65.00),
    (p_user_id, 'Lavagem Interna', 'RET', 40.00),
    (p_user_id, 'Lavagem Externa', 'RET', 32.00),
    (p_user_id, 'Lavagem Completa + Cera', 'RET', 80.00),
    (p_user_id, 'Lavagem Motor', 'RET', 25.00),
    (p_user_id, 'Lavagem Externa + Cera', 'RET', 48.00),
    (p_user_id, 'Vitrificação', 'RET', 240.00),
    (p_user_id, 'Hidratação de Bancos', 'RET', 120.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO NOTHING;

  -- SEDAN prices (1.0x base)
  INSERT INTO public.service_prices (user_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, 'Lavagem Completa', 'SEDAN', 80.00),
    (p_user_id, 'Lavagem Interna', 'SEDAN', 50.00),
    (p_user_id, 'Lavagem Externa', 'SEDAN', 40.00),
    (p_user_id, 'Lavagem Completa + Cera', 'SEDAN', 100.00),
    (p_user_id, 'Lavagem Motor', 'SEDAN', 30.00),
    (p_user_id, 'Lavagem Externa + Cera', 'SEDAN', 60.00),
    (p_user_id, 'Vitrificação', 'SEDAN', 300.00),
    (p_user_id, 'Hidratação de Bancos', 'SEDAN', 150.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO NOTHING;

  -- SUV prices (1.3x base)
  INSERT INTO public.service_prices (user_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, 'Lavagem Completa', 'SUV', 105.00),
    (p_user_id, 'Lavagem Interna', 'SUV', 65.00),
    (p_user_id, 'Lavagem Externa', 'SUV', 52.00),
    (p_user_id, 'Lavagem Completa + Cera', 'SUV', 130.00),
    (p_user_id, 'Lavagem Motor', 'SUV', 40.00),
    (p_user_id, 'Lavagem Externa + Cera', 'SUV', 78.00),
    (p_user_id, 'Vitrificação', 'SUV', 390.00),
    (p_user_id, 'Hidratação de Bancos', 'SUV', 195.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO NOTHING;

  -- CAMINHONETE prices (1.5x base)
  INSERT INTO public.service_prices (user_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, 'Lavagem Completa', 'CAMINHONETE', 120.00),
    (p_user_id, 'Lavagem Interna', 'CAMINHONETE', 75.00),
    (p_user_id, 'Lavagem Externa', 'CAMINHONETE', 60.00),
    (p_user_id, 'Lavagem Completa + Cera', 'CAMINHONETE', 150.00),
    (p_user_id, 'Lavagem Motor', 'CAMINHONETE', 45.00),
    (p_user_id, 'Lavagem Externa + Cera', 'CAMINHONETE', 90.00),
    (p_user_id, 'Vitrificação', 'CAMINHONETE', 450.00),
    (p_user_id, 'Hidratação de Bancos', 'CAMINHONETE', 225.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO NOTHING;

  -- OUTRO prices (same as SEDAN for default)
  INSERT INTO public.service_prices (user_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, 'Lavagem Completa', 'OUTRO', 80.00),
    (p_user_id, 'Lavagem Interna', 'OUTRO', 50.00),
    (p_user_id, 'Lavagem Externa', 'OUTRO', 40.00),
    (p_user_id, 'Lavagem Completa + Cera', 'OUTRO', 100.00),
    (p_user_id, 'Lavagem Motor', 'OUTRO', 30.00),
    (p_user_id, 'Lavagem Externa + Cera', 'OUTRO', 60.00),
    (p_user_id, 'Vitrificação', 'OUTRO', 300.00),
    (p_user_id, 'Hidratação de Bancos', 'OUTRO', 150.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO NOTHING;
END;
$function$;