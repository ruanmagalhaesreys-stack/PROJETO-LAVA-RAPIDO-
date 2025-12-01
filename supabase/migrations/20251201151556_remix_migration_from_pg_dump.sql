CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: initialize_expense_types(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_expense_types(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.expense_types (user_id, expense_name, default_value, is_fixed, available_day, due_day)
  VALUES 
    (p_user_id, 'Luz', NULL, false, 5, 15),
    (p_user_id, 'Água', NULL, false, 1, 10),
    (p_user_id, 'Aluguel', 1200.00, true, 1, 10),
    (p_user_id, 'Funcionário', NULL, false, 1, 5)
  ON CONFLICT (user_id, expense_name) DO NOTHING;
END;
$$;


--
-- Name: initialize_service_prices(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_service_prices(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_name text NOT NULL,
    client_phone text NOT NULL,
    car_make_model text NOT NULL,
    car_plate text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    car_color text
);


--
-- Name: daily_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid,
    client_name text NOT NULL,
    client_phone text NOT NULL,
    car_plate text NOT NULL,
    service_name text NOT NULL,
    value numeric(10,2) NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    date_yyyymmdd text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    car_make_model text,
    car_color text,
    CONSTRAINT daily_services_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'finalizado'::text])))
);


--
-- Name: expense_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expense_id uuid NOT NULL,
    shown_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: expense_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expense_name text NOT NULL,
    default_value numeric,
    is_fixed boolean DEFAULT false NOT NULL,
    available_day integer NOT NULL,
    due_day integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT expense_types_available_day_check CHECK (((available_day >= 1) AND (available_day <= 31))),
    CONSTRAINT expense_types_due_day_check CHECK (((due_day >= 1) AND (due_day <= 31)))
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    expense_type_id uuid,
    expense_name text NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    month_year text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at date,
    amount_paid numeric,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    category text,
    due_date date,
    is_recurring boolean DEFAULT true,
    CONSTRAINT expenses_status_check CHECK ((status = ANY (ARRAY['pendente'::text, 'pago'::text])))
);


--
-- Name: service_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_name text NOT NULL,
    price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: daily_services daily_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_services
    ADD CONSTRAINT daily_services_pkey PRIMARY KEY (id);


--
-- Name: expense_reminders expense_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_reminders
    ADD CONSTRAINT expense_reminders_pkey PRIMARY KEY (id);


--
-- Name: expense_reminders expense_reminders_user_id_expense_id_shown_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_reminders
    ADD CONSTRAINT expense_reminders_user_id_expense_id_shown_date_key UNIQUE (user_id, expense_id, shown_date);


--
-- Name: expense_types expense_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_types
    ADD CONSTRAINT expense_types_pkey PRIMARY KEY (id);


--
-- Name: expense_types expense_types_user_id_expense_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_types
    ADD CONSTRAINT expense_types_user_id_expense_name_key UNIQUE (user_id, expense_name);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_user_id_expense_type_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_user_id_expense_type_id_month_year_key UNIQUE (user_id, expense_type_id, month_year);


--
-- Name: service_prices service_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_pkey PRIMARY KEY (id);


--
-- Name: service_prices service_prices_user_id_service_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_prices
    ADD CONSTRAINT service_prices_user_id_service_name_key UNIQUE (user_id, service_name);


--
-- Name: idx_clients_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_phone ON public.clients USING btree (client_phone);


--
-- Name: idx_clients_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clients_user_id ON public.clients USING btree (user_id);


--
-- Name: idx_daily_services_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_services_date ON public.daily_services USING btree (date_yyyymmdd);


--
-- Name: idx_daily_services_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_services_user_id ON public.daily_services USING btree (user_id);


--
-- Name: idx_service_prices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_prices_user_id ON public.service_prices USING btree (user_id);


--
-- Name: clients update_clients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expense_types update_expense_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_expense_types_updated_at BEFORE UPDATE ON public.expense_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses update_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_prices update_service_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_prices_updated_at BEFORE UPDATE ON public.service_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: daily_services daily_services_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_services
    ADD CONSTRAINT daily_services_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: expense_reminders expense_reminders_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_reminders
    ADD CONSTRAINT expense_reminders_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_expense_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_expense_type_id_fkey FOREIGN KEY (expense_type_id) REFERENCES public.expense_types(id) ON DELETE CASCADE;


--
-- Name: clients Users can delete their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: expense_types Users can delete their own expense types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own expense types" ON public.expense_types FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: expenses Users can delete their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: service_prices Users can delete their own prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own prices" ON public.service_prices FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: daily_services Users can delete their own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own services" ON public.daily_services FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: clients Users can insert their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own clients" ON public.clients FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: expense_types Users can insert their own expense types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own expense types" ON public.expense_types FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: expenses Users can insert their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: service_prices Users can insert their own prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own prices" ON public.service_prices FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: expense_reminders Users can insert their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own reminders" ON public.expense_reminders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: daily_services Users can insert their own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own services" ON public.daily_services FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: clients Users can update their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: expense_types Users can update their own expense types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own expense types" ON public.expense_types FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: expenses Users can update their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: service_prices Users can update their own prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own prices" ON public.service_prices FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: daily_services Users can update their own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own services" ON public.daily_services FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: clients Users can view their own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: expense_types Users can view their own expense types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own expense types" ON public.expense_types FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: expenses Users can view their own expenses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: service_prices Users can view their own prices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own prices" ON public.service_prices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: expense_reminders Users can view their own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reminders" ON public.expense_reminders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: daily_services Users can view their own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own services" ON public.daily_services FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_services ENABLE ROW LEVEL SECURITY;

--
-- Name: expense_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expense_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: expense_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;

--
-- Name: expenses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

--
-- Name: service_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


