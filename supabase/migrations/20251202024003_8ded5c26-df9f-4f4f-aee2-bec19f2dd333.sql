-- Create enum for business member roles
CREATE TYPE public.app_role AS ENUM ('owner', 'partner');

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Create business_members table
CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- Create business_invites table
CREATE TABLE public.business_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  used_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_invites ENABLE ROW LEVEL SECURITY;

-- Add business_id and audit columns to existing tables
ALTER TABLE public.daily_services 
  ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  ADD COLUMN created_by_member_id UUID REFERENCES public.business_members(id),
  ADD COLUMN finished_by_member_id UUID REFERENCES public.business_members(id);

ALTER TABLE public.expenses 
  ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  ADD COLUMN created_by_member_id UUID REFERENCES public.business_members(id),
  ADD COLUMN paid_by_member_id UUID REFERENCES public.business_members(id);

ALTER TABLE public.clients 
  ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.expense_types 
  ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.service_prices 
  ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.expense_reminders 
  ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Create security definer function to get user's business_id
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id 
  FROM public.business_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Create security definer function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.business_members 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Create security definer function to get member's display name
CREATE OR REPLACE FUNCTION public.get_member_name(member_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name 
  FROM public.business_members 
  WHERE id = member_id
  LIMIT 1;
$$;

-- Create security definer function to check business access
CREATE OR REPLACE FUNCTION public.has_business_access(check_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members
    WHERE user_id = auth.uid()
      AND business_id = check_business_id
  );
$$;

-- Drop old RLS policies and create new ones for businesses
CREATE POLICY "Users can view their businesses"
ON public.businesses FOR SELECT
USING (
  owner_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.business_members 
    WHERE business_id = businesses.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own business"
ON public.businesses FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- RLS policies for business_members
CREATE POLICY "Users can view members of their business"
ON public.business_members FOR SELECT
USING (public.has_business_access(business_id));

CREATE POLICY "Owners can insert members"
ON public.business_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete members"
ON public.business_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

-- RLS policies for business_invites
CREATE POLICY "Users can view invites for their business"
ON public.business_invites FOR SELECT
USING (public.has_business_access(business_id));

CREATE POLICY "Owners can create invites"
ON public.business_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update invites"
ON public.business_invites FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = business_id AND owner_id = auth.uid()
  )
);

-- Update RLS policies for daily_services
DROP POLICY IF EXISTS "Users can view their own services" ON public.daily_services;
DROP POLICY IF EXISTS "Users can insert their own services" ON public.daily_services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.daily_services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.daily_services;

CREATE POLICY "Business members can view services"
ON public.daily_services FOR SELECT
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can insert services"
ON public.daily_services FOR INSERT
WITH CHECK (business_id = public.get_user_business_id());

CREATE POLICY "Business members can update services"
ON public.daily_services FOR UPDATE
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can delete services"
ON public.daily_services FOR DELETE
USING (business_id = public.get_user_business_id());

-- Update RLS policies for expenses
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

CREATE POLICY "Business members can view expenses"
ON public.expenses FOR SELECT
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (business_id = public.get_user_business_id());

CREATE POLICY "Business members can update expenses"
ON public.expenses FOR UPDATE
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can delete expenses"
ON public.expenses FOR DELETE
USING (business_id = public.get_user_business_id());

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

CREATE POLICY "Business members can view clients"
ON public.clients FOR SELECT
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can insert clients"
ON public.clients FOR INSERT
WITH CHECK (business_id = public.get_user_business_id());

CREATE POLICY "Business members can update clients"
ON public.clients FOR UPDATE
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can delete clients"
ON public.clients FOR DELETE
USING (business_id = public.get_user_business_id());

-- Update RLS policies for expense_types
DROP POLICY IF EXISTS "Users can view their own expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Users can insert their own expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Users can update their own expense types" ON public.expense_types;
DROP POLICY IF EXISTS "Users can delete their own expense types" ON public.expense_types;

CREATE POLICY "Business members can view expense types"
ON public.expense_types FOR SELECT
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can insert expense types"
ON public.expense_types FOR INSERT
WITH CHECK (business_id = public.get_user_business_id());

CREATE POLICY "Business members can update expense types"
ON public.expense_types FOR UPDATE
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can delete expense types"
ON public.expense_types FOR DELETE
USING (business_id = public.get_user_business_id());

-- Update RLS policies for service_prices
DROP POLICY IF EXISTS "Users can view their own prices" ON public.service_prices;
DROP POLICY IF EXISTS "Users can insert their own prices" ON public.service_prices;
DROP POLICY IF EXISTS "Users can update their own prices" ON public.service_prices;
DROP POLICY IF EXISTS "Users can delete their own prices" ON public.service_prices;

CREATE POLICY "Business members can view prices"
ON public.service_prices FOR SELECT
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can insert prices"
ON public.service_prices FOR INSERT
WITH CHECK (business_id = public.get_user_business_id());

CREATE POLICY "Business members can update prices"
ON public.service_prices FOR UPDATE
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can delete prices"
ON public.service_prices FOR DELETE
USING (business_id = public.get_user_business_id());

-- Update RLS policies for expense_reminders
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.expense_reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.expense_reminders;

CREATE POLICY "Business members can view reminders"
ON public.expense_reminders FOR SELECT
USING (business_id = public.get_user_business_id());

CREATE POLICY "Business members can insert reminders"
ON public.expense_reminders FOR INSERT
WITH CHECK (business_id = public.get_user_business_id());

-- Create function to auto-create business for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_business_id UUID;
BEGIN
  -- Create a business for the new user
  INSERT INTO public.businesses (owner_id, name)
  VALUES (NEW.id, 'Meu Lava Rápido')
  RETURNING id INTO new_business_id;
  
  -- Add user as owner in business_members
  INSERT INTO public.business_members (business_id, user_id, role, display_name)
  VALUES (new_business_id, NEW.id, 'owner', COALESCE(NEW.raw_user_meta_data->>'display_name', 'Proprietário'));
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing data
DO $$
DECLARE
  existing_user_id UUID;
  new_business_id UUID;
  new_member_id UUID;
BEGIN
  -- Get the first user (should be you)
  SELECT id INTO existing_user_id FROM auth.users LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    -- Create business for existing user
    INSERT INTO public.businesses (owner_id, name)
    VALUES (existing_user_id, 'Meu Lava Rápido')
    RETURNING id INTO new_business_id;
    
    -- Add existing user as owner
    INSERT INTO public.business_members (business_id, user_id, role, display_name)
    VALUES (new_business_id, existing_user_id, 'owner', 'Proprietário')
    RETURNING id INTO new_member_id;
    
    -- Update all existing data to belong to this business
    UPDATE public.daily_services SET business_id = new_business_id, created_by_member_id = new_member_id WHERE business_id IS NULL;
    UPDATE public.expenses SET business_id = new_business_id, created_by_member_id = new_member_id WHERE business_id IS NULL;
    UPDATE public.clients SET business_id = new_business_id WHERE business_id IS NULL;
    UPDATE public.expense_types SET business_id = new_business_id WHERE business_id IS NULL;
    UPDATE public.service_prices SET business_id = new_business_id WHERE business_id IS NULL;
    UPDATE public.expense_reminders SET business_id = new_business_id WHERE business_id IS NULL;
  END IF;
END $$;