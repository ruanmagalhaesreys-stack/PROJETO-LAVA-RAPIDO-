
-- 1. Add code column to businesses table
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- 2. Create function to generate unique business code
CREATE OR REPLACE FUNCTION public.generate_business_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.code := 'LR-' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6));
  RETURN NEW;
END;
$$;

-- 3. Create trigger to auto-generate code on insert
DROP TRIGGER IF EXISTS set_business_code ON public.businesses;
CREATE TRIGGER set_business_code
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_business_code();

-- 4. Generate codes for existing businesses
UPDATE public.businesses 
SET code = 'LR-' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 6))
WHERE code IS NULL;

-- 5. Make code NOT NULL after populating
ALTER TABLE public.businesses ALTER COLUMN code SET NOT NULL;

-- 6. Update initialize_expense_types to use business_id
CREATE OR REPLACE FUNCTION public.initialize_expense_types(p_user_id uuid, p_business_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_business_id uuid;
BEGIN
  -- Get business_id if not provided
  IF p_business_id IS NULL THEN
    SELECT business_id INTO v_business_id 
    FROM public.business_members 
    WHERE user_id = p_user_id 
    LIMIT 1;
  ELSE
    v_business_id := p_business_id;
  END IF;

  INSERT INTO public.expense_types (user_id, business_id, expense_name, default_value, is_fixed, available_day, due_day)
  VALUES 
    (p_user_id, v_business_id, 'Luz', NULL, false, 5, 15),
    (p_user_id, v_business_id, 'Água', NULL, false, 1, 10),
    (p_user_id, v_business_id, 'Aluguel', 1200.00, true, 1, 10),
    (p_user_id, v_business_id, 'Funcionário', NULL, false, 1, 5)
  ON CONFLICT (user_id, expense_name) DO UPDATE SET business_id = EXCLUDED.business_id;
END;
$function$;

-- 7. Update initialize_service_prices to use business_id  
CREATE OR REPLACE FUNCTION public.initialize_service_prices(p_user_id uuid, p_business_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_business_id uuid;
BEGIN
  -- Get business_id if not provided
  IF p_business_id IS NULL THEN
    SELECT business_id INTO v_business_id 
    FROM public.business_members 
    WHERE user_id = p_user_id 
    LIMIT 1;
  ELSE
    v_business_id := p_business_id;
  END IF;

  -- MOTO prices (0.5x base)
  INSERT INTO public.service_prices (user_id, business_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, v_business_id, 'Lavagem Completa', 'MOTO', 40.00),
    (p_user_id, v_business_id, 'Lavagem Interna', 'MOTO', 25.00),
    (p_user_id, v_business_id, 'Lavagem Externa', 'MOTO', 20.00),
    (p_user_id, v_business_id, 'Lavagem Completa + Cera', 'MOTO', 50.00),
    (p_user_id, v_business_id, 'Lavagem Motor', 'MOTO', 15.00),
    (p_user_id, v_business_id, 'Lavagem Externa + Cera', 'MOTO', 30.00),
    (p_user_id, v_business_id, 'Vitrificação', 'MOTO', 150.00),
    (p_user_id, v_business_id, 'Hidratação de Bancos', 'MOTO', 75.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO UPDATE SET business_id = EXCLUDED.business_id;

  -- RET prices (0.8x base)
  INSERT INTO public.service_prices (user_id, business_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, v_business_id, 'Lavagem Completa', 'RET', 65.00),
    (p_user_id, v_business_id, 'Lavagem Interna', 'RET', 40.00),
    (p_user_id, v_business_id, 'Lavagem Externa', 'RET', 32.00),
    (p_user_id, v_business_id, 'Lavagem Completa + Cera', 'RET', 80.00),
    (p_user_id, v_business_id, 'Lavagem Motor', 'RET', 25.00),
    (p_user_id, v_business_id, 'Lavagem Externa + Cera', 'RET', 48.00),
    (p_user_id, v_business_id, 'Vitrificação', 'RET', 240.00),
    (p_user_id, v_business_id, 'Hidratação de Bancos', 'RET', 120.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO UPDATE SET business_id = EXCLUDED.business_id;

  -- SEDAN prices (1.0x base)
  INSERT INTO public.service_prices (user_id, business_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, v_business_id, 'Lavagem Completa', 'SEDAN', 80.00),
    (p_user_id, v_business_id, 'Lavagem Interna', 'SEDAN', 50.00),
    (p_user_id, v_business_id, 'Lavagem Externa', 'SEDAN', 40.00),
    (p_user_id, v_business_id, 'Lavagem Completa + Cera', 'SEDAN', 100.00),
    (p_user_id, v_business_id, 'Lavagem Motor', 'SEDAN', 30.00),
    (p_user_id, v_business_id, 'Lavagem Externa + Cera', 'SEDAN', 60.00),
    (p_user_id, v_business_id, 'Vitrificação', 'SEDAN', 300.00),
    (p_user_id, v_business_id, 'Hidratação de Bancos', 'SEDAN', 150.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO UPDATE SET business_id = EXCLUDED.business_id;

  -- SUV prices (1.3x base)
  INSERT INTO public.service_prices (user_id, business_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, v_business_id, 'Lavagem Completa', 'SUV', 105.00),
    (p_user_id, v_business_id, 'Lavagem Interna', 'SUV', 65.00),
    (p_user_id, v_business_id, 'Lavagem Externa', 'SUV', 52.00),
    (p_user_id, v_business_id, 'Lavagem Completa + Cera', 'SUV', 130.00),
    (p_user_id, v_business_id, 'Lavagem Motor', 'SUV', 40.00),
    (p_user_id, v_business_id, 'Lavagem Externa + Cera', 'SUV', 78.00),
    (p_user_id, v_business_id, 'Vitrificação', 'SUV', 390.00),
    (p_user_id, v_business_id, 'Hidratação de Bancos', 'SUV', 195.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO UPDATE SET business_id = EXCLUDED.business_id;

  -- CAMINHONETE prices (1.5x base)
  INSERT INTO public.service_prices (user_id, business_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, v_business_id, 'Lavagem Completa', 'CAMINHONETE', 120.00),
    (p_user_id, v_business_id, 'Lavagem Interna', 'CAMINHONETE', 75.00),
    (p_user_id, v_business_id, 'Lavagem Externa', 'CAMINHONETE', 60.00),
    (p_user_id, v_business_id, 'Lavagem Completa + Cera', 'CAMINHONETE', 150.00),
    (p_user_id, v_business_id, 'Lavagem Motor', 'CAMINHONETE', 45.00),
    (p_user_id, v_business_id, 'Lavagem Externa + Cera', 'CAMINHONETE', 90.00),
    (p_user_id, v_business_id, 'Vitrificação', 'CAMINHONETE', 450.00),
    (p_user_id, v_business_id, 'Hidratação de Bancos', 'CAMINHONETE', 225.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO UPDATE SET business_id = EXCLUDED.business_id;

  -- OUTRO prices (same as SEDAN for default)
  INSERT INTO public.service_prices (user_id, business_id, service_name, vehicle_type, price)
  VALUES 
    (p_user_id, v_business_id, 'Lavagem Completa', 'OUTRO', 80.00),
    (p_user_id, v_business_id, 'Lavagem Interna', 'OUTRO', 50.00),
    (p_user_id, v_business_id, 'Lavagem Externa', 'OUTRO', 40.00),
    (p_user_id, v_business_id, 'Lavagem Completa + Cera', 'OUTRO', 100.00),
    (p_user_id, v_business_id, 'Lavagem Motor', 'OUTRO', 30.00),
    (p_user_id, v_business_id, 'Lavagem Externa + Cera', 'OUTRO', 60.00),
    (p_user_id, v_business_id, 'Vitrificação', 'OUTRO', 300.00),
    (p_user_id, v_business_id, 'Hidratação de Bancos', 'OUTRO', 150.00)
  ON CONFLICT (user_id, service_name, vehicle_type) DO UPDATE SET business_id = EXCLUDED.business_id;
END;
$function$;

-- 8. Create function to find business by code (for partners to connect)
CREATE OR REPLACE FUNCTION public.find_business_by_code(p_code TEXT)
RETURNS TABLE(id uuid, name text, owner_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.name,
    bm.display_name as owner_name
  FROM public.businesses b
  JOIN public.business_members bm ON bm.business_id = b.id AND bm.role = 'owner'
  WHERE b.code = UPPER(p_code)
  LIMIT 1;
$$;

-- 9. Create function to connect partner to business
CREATE OR REPLACE FUNCTION public.connect_to_business(p_code TEXT, p_display_name TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Find business by code
  SELECT id INTO v_business_id 
  FROM public.businesses 
  WHERE code = UPPER(p_code);
  
  IF v_business_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if already a member
  IF EXISTS (SELECT 1 FROM public.business_members WHERE user_id = v_user_id) THEN
    RETURN false;
  END IF;
  
  -- Add as partner
  INSERT INTO public.business_members (business_id, user_id, role, display_name)
  VALUES (v_business_id, v_user_id, 'partner', p_display_name);
  
  RETURN true;
END;
$$;

-- 10. Create function to disconnect partner from business
CREATE OR REPLACE FUNCTION public.disconnect_from_business()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow partners to disconnect (not owners)
  DELETE FROM public.business_members 
  WHERE user_id = auth.uid() AND role = 'partner';
  
  RETURN FOUND;
END;
$$;

-- 11. Update handle_new_user to NOT auto-create business (we'll do it in setup page)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Don't auto-create business anymore, user will choose in setup page
  RETURN NEW;
END;
$function$;

-- 12. Create function to create business for new owner
CREATE OR REPLACE FUNCTION public.create_my_business(p_display_name TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if already has a business
  IF EXISTS (SELECT 1 FROM public.business_members WHERE user_id = v_user_id) THEN
    RETURN NULL;
  END IF;
  
  -- Create business
  INSERT INTO public.businesses (owner_id, name)
  VALUES (v_user_id, 'Meu Lava Rápido')
  RETURNING id INTO v_business_id;
  
  -- Add as owner
  INSERT INTO public.business_members (business_id, user_id, role, display_name)
  VALUES (v_business_id, v_user_id, 'owner', p_display_name);
  
  -- Initialize expense types and service prices
  PERFORM public.initialize_expense_types(v_user_id, v_business_id);
  PERFORM public.initialize_service_prices(v_user_id, v_business_id);
  
  RETURN v_business_id;
END;
$$;
