-- Add car_color to clients table
ALTER TABLE public.clients ADD COLUMN car_color TEXT;

-- Add car_make_model and car_color to daily_services table
ALTER TABLE public.daily_services ADD COLUMN car_make_model TEXT;
ALTER TABLE public.daily_services ADD COLUMN car_color TEXT;

-- Create expense_types table
CREATE TABLE public.expense_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_name TEXT NOT NULL,
  default_value NUMERIC,
  is_fixed BOOLEAN NOT NULL DEFAULT false,
  available_day INTEGER NOT NULL CHECK (available_day >= 1 AND available_day <= 31),
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, expense_name)
);

-- Enable RLS on expense_types
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_types
CREATE POLICY "Users can view their own expense types"
  ON public.expense_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expense types"
  ON public.expense_types FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense types"
  ON public.expense_types FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense types"
  ON public.expense_types FOR DELETE
  USING (auth.uid() = user_id);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_type_id UUID NOT NULL REFERENCES public.expense_types(id) ON DELETE CASCADE,
  expense_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago')),
  month_year TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at DATE,
  amount_paid NUMERIC,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, expense_type_id, month_year)
);

-- Enable RLS on expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Create expense_reminders table
CREATE TABLE public.expense_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  shown_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, expense_id, shown_date)
);

-- Enable RLS on expense_reminders
ALTER TABLE public.expense_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_reminders
CREATE POLICY "Users can view their own reminders"
  ON public.expense_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON public.expense_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updating updated_at on expense_types
CREATE TRIGGER update_expense_types_updated_at
  BEFORE UPDATE ON public.expense_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at on expenses
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize expense types with default values
CREATE OR REPLACE FUNCTION public.initialize_expense_types(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.expense_types (user_id, expense_name, default_value, is_fixed, available_day, due_day)
  VALUES 
    (p_user_id, 'Luz', NULL, false, 5, 15),
    (p_user_id, 'Água', NULL, false, 1, 10),
    (p_user_id, 'Aluguel', 1200.00, true, 1, 10),
    (p_user_id, 'Funcionário', NULL, false, 1, 5),
    (p_user_id, 'Produtos', NULL, false, 1, 30)
  ON CONFLICT (user_id, expense_name) DO NOTHING;
END;
$$;