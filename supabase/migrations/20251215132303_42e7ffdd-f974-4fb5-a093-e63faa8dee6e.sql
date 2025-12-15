-- Business-wide "active day" state so Owner + Sócio ficam 100% sincronizados
CREATE TABLE IF NOT EXISTS public.business_day_state (
  business_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  active_date_yyyymmdd text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_day_state ENABLE ROW LEVEL SECURITY;

-- Members can read the current active day for their business
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'business_day_state' 
      AND policyname = 'Business members can view day state'
  ) THEN
    CREATE POLICY "Business members can view day state"
    ON public.business_day_state
    FOR SELECT
    USING (business_id = public.get_user_business_id());
  END IF;
END $$;

-- Members can create the row (first time) for their business
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'business_day_state' 
      AND policyname = 'Business members can insert day state'
  ) THEN
    CREATE POLICY "Business members can insert day state"
    ON public.business_day_state
    FOR INSERT
    WITH CHECK (business_id = public.get_user_business_id());
  END IF;
END $$;

-- Members can advance the day (update)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'business_day_state' 
      AND policyname = 'Business members can update day state'
  ) THEN
    CREATE POLICY "Business members can update day state"
    ON public.business_day_state
    FOR UPDATE
    USING (business_id = public.get_user_business_id())
    WITH CHECK (business_id = public.get_user_business_id());
  END IF;
END $$;

-- updated_at trigger
DROP TRIGGER IF EXISTS update_business_day_state_updated_at ON public.business_day_state;
CREATE TRIGGER update_business_day_state_updated_at
BEFORE UPDATE ON public.business_day_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime enablement (safe if re-run)
ALTER TABLE public.daily_services REPLICA IDENTITY FULL;
ALTER TABLE public.business_day_state REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_services;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.business_day_state;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
