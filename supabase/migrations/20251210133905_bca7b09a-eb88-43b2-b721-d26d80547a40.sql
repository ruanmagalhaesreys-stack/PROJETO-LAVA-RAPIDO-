-- Limpeza completa de todos os dados de teste
-- Ordem importante: primeiro as tabelas dependentes, depois as principais

-- 1. Limpar lembretes de despesas
DELETE FROM expense_reminders;

-- 2. Limpar despesas
DELETE FROM expenses;

-- 3. Limpar serviços diários
DELETE FROM daily_services;

-- 4. Limpar clientes
DELETE FROM clients;

-- 5. Limpar preços de serviços (serão regenerados no setup)
DELETE FROM service_prices;

-- 6. Limpar tipos de despesas (serão regenerados no setup)
DELETE FROM expense_types;

-- 7. Limpar convites de negócios
DELETE FROM business_invites;

-- 8. Limpar membros de negócios
DELETE FROM business_members;

-- 9. Limpar businesses
DELETE FROM businesses;