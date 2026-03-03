create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'loan_status') then
    create type public.loan_status as enum (
      'APPLICATION',
      'UNDER_REVIEW',
      'APPROVED',
      'FUNDED',
      'ACTIVE',
      'LATE',
      'DEFAULTED',
      'CLOSED'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_type') then
    create type public.payment_type as enum ('INTEREST', 'PRINCIPAL', 'PENALTY');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'investor_status') then
    create type public.investor_status as enum ('ACTIVE', 'INACTIVE');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'investor_transaction_type') then
    create type public.investor_transaction_type as enum (
      'DEPOSIT',
      'WITHDRAWAL',
      'ALLOCATION',
      'RETURN',
      'LOAN_ALLOCATION',
      'RETURN_PAYMENT'
    );
  end if;
end
$$;

alter type public.investor_transaction_type add value if not exists 'ALLOCATION';
alter type public.investor_transaction_type add value if not exists 'RETURN';
alter type public.investor_transaction_type add value if not exists 'LOAN_ALLOCATION';
alter type public.investor_transaction_type add value if not exists 'RETURN_PAYMENT';

create table if not exists public.borrowers (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  full_name text not null,
  phone text not null,
  phone_number text not null,
  email text not null,
  address text not null,
  contract_date date,
  date_of_birth date not null,
  government_id text not null,
  government_id_number text not null,
  supporting_document_url text,
  notes text,
  intake_record text,
  witness_full_name text,
  witness_phone text,
  witness_email text,
  witness_address text,
  attorney_name text,
  law_firm_name text,
  attorney_phone text,
  attorney_email text,
  attorney_office_address text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  loan_id text not null unique,
  borrower_id uuid not null references public.borrowers(id) on delete restrict,
  principal_amount numeric(14,2) not null check (principal_amount > 0),
  interest_rate numeric(6,3) not null check (interest_rate >= 0),
  start_date date not null,
  maturity_date date not null,
  status public.loan_status not null default 'APPLICATION',
  loan_status public.loan_status not null default 'APPLICATION',
  collateral_description text,
  collateral_estimated_value numeric(14,2),
  current_balance numeric(14,2),
  amount_in_dollars numeric(14,2),
  amount_balance_to_refund numeric(14,2),
  monthly_payment numeric(14,2),
  payment_due_date date,
  unpaid_monthly_due numeric(14,2),
  means_of_payment text,
  arrears numeric(14,2),
  risk_rating text,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maturity_after_start check (maturity_date >= start_date)
);

create table if not exists public.loan_payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_amount numeric(14,2) not null check (payment_amount > 0),
  payment_type public.payment_type not null,
  payment_date date not null default current_date,
  recorded_by uuid references public.users(id),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.investors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null unique,
  address text not null,
  notes text,
  total_capital_invested numeric(14,2) not null default 0,
  available_balance numeric(14,2) not null default 0,
  total_returns numeric(14,2) not null default 0,
  total_returns_earned numeric(14,2) not null default 0,
  status public.investor_status not null default 'ACTIVE',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investor_transactions (
  id uuid primary key default gen_random_uuid(),
  investor_id uuid not null references public.investors(id) on delete cascade,
  loan_id uuid references public.loans(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  transaction_type public.investor_transaction_type not null,
  transaction_date date not null default current_date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.borrowers add column if not exists phone text;
alter table public.borrowers add column if not exists government_id text;
alter table public.borrowers add column if not exists phone_number text;
alter table public.borrowers add column if not exists government_id_number text;
alter table public.borrowers add column if not exists first_name text;
alter table public.borrowers add column if not exists last_name text;
alter table public.borrowers add column if not exists contract_date date;
alter table public.borrowers add column if not exists supporting_document_url text;
alter table public.borrowers add column if not exists intake_record text;

alter table public.loans add column if not exists status public.loan_status default 'APPLICATION';
alter table public.loans add column if not exists loan_status public.loan_status default 'APPLICATION';
alter table public.loans add column if not exists current_balance numeric(14,2);
alter table public.loans add column if not exists amount_in_dollars numeric(14,2);
alter table public.loans add column if not exists amount_balance_to_refund numeric(14,2);
alter table public.loans add column if not exists monthly_payment numeric(14,2);
alter table public.loans add column if not exists payment_due_date date;
alter table public.loans add column if not exists unpaid_monthly_due numeric(14,2);
alter table public.loans add column if not exists means_of_payment text;
alter table public.loans add column if not exists arrears numeric(14,2);

alter table public.loan_payments add column if not exists amount numeric(14,2);
alter table public.loan_payments add column if not exists payment_amount numeric(14,2);

alter table public.investors add column if not exists total_returns numeric(14,2) not null default 0;
alter table public.investors add column if not exists total_returns_earned numeric(14,2) not null default 0;
alter table public.investors add column if not exists notes text;

update public.borrowers
set
  phone = coalesce(phone, phone_number),
  phone_number = coalesce(phone_number, phone),
  government_id = coalesce(government_id, government_id_number),
  government_id_number = coalesce(government_id_number, government_id);

update public.loans
set
  status = coalesce(status, loan_status, 'APPLICATION'),
  loan_status = coalesce(loan_status, status, 'APPLICATION');

update public.loan_payments
set
  amount = coalesce(amount, payment_amount),
  payment_amount = coalesce(payment_amount, amount);

update public.investors
set
  total_returns = coalesce(total_returns, total_returns_earned, 0),
  total_returns_earned = coalesce(total_returns_earned, total_returns, 0);

update public.investor_transactions
set transaction_type = case transaction_type
  when 'LOAN_ALLOCATION' then 'ALLOCATION'
  when 'RETURN_PAYMENT' then 'RETURN'
  else transaction_type
end;

create or replace function public.normalize_compat_columns()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'borrowers' then
    new.phone := coalesce(new.phone, new.phone_number);
    new.phone_number := coalesce(new.phone_number, new.phone);
    new.government_id := coalesce(new.government_id, new.government_id_number);
    new.government_id_number := coalesce(new.government_id_number, new.government_id);
  elsif tg_table_name = 'loans' then
    new.status := coalesce(new.status, new.loan_status, 'APPLICATION');
    new.loan_status := coalesce(new.loan_status, new.status, 'APPLICATION');
  elsif tg_table_name = 'loan_payments' then
    new.amount := coalesce(new.amount, new.payment_amount);
    new.payment_amount := coalesce(new.payment_amount, new.amount);
  elsif tg_table_name = 'investors' then
    new.total_returns := coalesce(new.total_returns, new.total_returns_earned, 0);
    new.total_returns_earned := coalesce(new.total_returns_earned, new.total_returns, 0);
  elsif tg_table_name = 'investor_transactions' then
    new.transaction_type := case new.transaction_type
      when 'LOAN_ALLOCATION' then 'ALLOCATION'
      when 'RETURN_PAYMENT' then 'RETURN'
      else new.transaction_type
    end;
  end if;
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists borrowers_compat_trigger on public.borrowers;
create trigger borrowers_compat_trigger
before insert or update on public.borrowers
for each row execute procedure public.normalize_compat_columns();

drop trigger if exists loans_compat_trigger on public.loans;
create trigger loans_compat_trigger
before insert or update on public.loans
for each row execute procedure public.normalize_compat_columns();

drop trigger if exists loan_payments_compat_trigger on public.loan_payments;
create trigger loan_payments_compat_trigger
before insert or update on public.loan_payments
for each row execute procedure public.normalize_compat_columns();

drop trigger if exists investors_compat_trigger on public.investors;
create trigger investors_compat_trigger
before insert or update on public.investors
for each row execute procedure public.normalize_compat_columns();

drop trigger if exists investor_transactions_compat_trigger on public.investor_transactions;
create trigger investor_transactions_compat_trigger
before insert or update on public.investor_transactions
for each row execute procedure public.normalize_compat_columns();

drop trigger if exists borrowers_set_updated_at on public.borrowers;
create trigger borrowers_set_updated_at
before update on public.borrowers
for each row execute procedure public.set_updated_at();

drop trigger if exists loans_set_updated_at on public.loans;
create trigger loans_set_updated_at
before update on public.loans
for each row execute procedure public.set_updated_at();

drop trigger if exists investors_set_updated_at on public.investors;
create trigger investors_set_updated_at
before update on public.investors
for each row execute procedure public.set_updated_at();

create index if not exists idx_borrowers_email on public.borrowers(email);
create index if not exists idx_borrowers_phone on public.borrowers(phone);
create index if not exists idx_loans_borrower_id on public.loans(borrower_id);
create index if not exists idx_loans_status on public.loans(status);
create index if not exists idx_loans_created_at on public.loans(created_at);
create index if not exists idx_loans_borrower_status on public.loans(borrower_id, status);
create index if not exists idx_loan_payments_loan_id on public.loan_payments(loan_id);
create index if not exists idx_loan_payments_payment_date on public.loan_payments(payment_date);
create index if not exists idx_investor_transactions_investor_id on public.investor_transactions(investor_id);
create index if not exists idx_investor_transactions_loan_id on public.investor_transactions(loan_id);
create index if not exists idx_investor_transactions_txn_date on public.investor_transactions(transaction_date);

alter table public.users enable row level security;
alter table public.borrowers enable row level security;
alter table public.loans enable row level security;
alter table public.loan_payments enable row level security;
alter table public.investors enable row level security;
alter table public.investor_transactions enable row level security;

drop policy if exists users_authenticated_select on public.users;
create policy users_authenticated_select on public.users
for select using (auth.role() = 'authenticated');

drop policy if exists borrowers_authenticated_crud on public.borrowers;
create policy borrowers_authenticated_crud on public.borrowers
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists loans_authenticated_crud on public.loans;
create policy loans_authenticated_crud on public.loans
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists loan_payments_authenticated_crud on public.loan_payments;
create policy loan_payments_authenticated_crud on public.loan_payments
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists investors_authenticated_crud on public.investors;
create policy investors_authenticated_crud on public.investors
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists investor_transactions_authenticated_crud on public.investor_transactions;
create policy investor_transactions_authenticated_crud on public.investor_transactions
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
