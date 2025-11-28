-- Fix search_path for initialize_service_prices function
DROP FUNCTION IF EXISTS public.initialize_service_prices(UUID);

CREATE OR REPLACE FUNCTION public.initialize_service_prices(p_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.service_prices (user_id, service_name, price)
  VALUES 
    (p_user_id, 'Lavagem interna', 50.00),
    (p_user_id, 'Lavagem externa', 40.00),
    (p_user_id, 'Lavagem completa', 80.00),
    (p_user_id, 'Lavagem completa com cera líquida', 100.00),
    (p_user_id, 'Lavagem completa com cera em pasta', 120.00),
    (p_user_id, 'Vitrificação', 300.00),
    (p_user_id, 'Polimento', 250.00)
  ON CONFLICT (user_id, service_name) DO NOTHING;
END;
$$;