-- Add new columns to expenses table for additional expenses
ALTER TABLE public.expenses
ADD COLUMN category text,
ADD COLUMN due_date date,
ADD COLUMN is_recurring boolean DEFAULT true;

-- Make expense_type_id nullable (for additional expenses)
ALTER TABLE public.expenses
ALTER COLUMN expense_type_id DROP NOT NULL;

-- Delete 'Produtos' from expense_types
DELETE FROM public.expense_types WHERE expense_name = 'Produtos';

-- Update the initialize_expense_types function to remove 'Produtos'
CREATE OR REPLACE FUNCTION public.initialize_expense_types(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.expense_types (user_id, expense_name, default_value, is_fixed, available_day, due_day)
  VALUES 
    (p_user_id, 'Luz', NULL, false, 5, 15),
    (p_user_id, 'Água', NULL, false, 1, 10),
    (p_user_id, 'Aluguel', 1200.00, true, 1, 10),
    (p_user_id, 'Funcionário', NULL, false, 1, 5)
  ON CONFLICT (user_id, expense_name) DO NOTHING;
END;
$function$;