-- Create clients table (Master Database)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  car_make_model TEXT NOT NULL,
  car_plate TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create daily_services table (Service History)
CREATE TABLE public.daily_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  car_plate TEXT NOT NULL,
  service_name TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'finalizado')),
  date_yyyymmdd TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create service_prices table (Price Management)
CREATE TABLE public.service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, service_name)
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_services
CREATE POLICY "Users can view their own services"
  ON public.daily_services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON public.daily_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON public.daily_services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services"
  ON public.daily_services FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for service_prices
CREATE POLICY "Users can view their own prices"
  ON public.service_prices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prices"
  ON public.service_prices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prices"
  ON public.service_prices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prices"
  ON public.service_prices FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_phone ON public.clients(client_phone);
CREATE INDEX idx_daily_services_user_id ON public.daily_services(user_id);
CREATE INDEX idx_daily_services_date ON public.daily_services(date_yyyymmdd);
CREATE INDEX idx_service_prices_user_id ON public.service_prices(user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_prices_updated_at
  BEFORE UPDATE ON public.service_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default service prices (7 services as specified)
-- Note: This will be inserted with the user_id when they first log in
-- For now, creating a function to initialize prices for a user
CREATE OR REPLACE FUNCTION public.initialize_service_prices(p_user_id UUID)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;