-- Sample seed data for development and demos.
insert into public.users (id, clerk_user_id, email, full_name, role)
values
  ('00000000-0000-0000-0000-000000000101', 'clerk_demo_admin', 'admin@privatelend.local', 'Demo Admin', 'admin')
on conflict (clerk_user_id) do nothing;

insert into public.borrowers (
  id, full_name, phone_number, email, address, date_of_birth, government_id_number, notes,
  witness_full_name, witness_phone, witness_email, witness_address,
  attorney_name, law_firm_name, attorney_phone, attorney_email, attorney_office_address, created_by
)
values
  (
    '00000000-0000-0000-0000-000000000201',
    'Olivia Bennett', '+1-555-0101', 'olivia@example.com', '200 River St, Austin, TX',
    '1989-08-12', 'TX-77-0192', 'Small business expansion loan',
    'Daniel Bennett', '+1-555-0102', 'daniel@example.com', '200 River St, Austin, TX',
    'Amara Cole', 'Cole Legal', '+1-555-0199', 'amara@coletlaw.com', '712 Main Ave, Austin, TX',
    '00000000-0000-0000-0000-000000000101'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    'Noah Carter', '+1-555-0103', 'noah@example.com', '88 Central Blvd, Dallas, TX',
    '1992-03-04', 'TX-88-1450', 'Bridge financing request',
    'Mia Carter', '+1-555-0104', 'mia@example.com', '88 Central Blvd, Dallas, TX',
    'Ivy Stone', 'Stone & Partners', '+1-555-0105', 'ivy@stonefirm.com', '100 Legal Plaza, Dallas, TX',
    '00000000-0000-0000-0000-000000000101'
  )
on conflict (id) do nothing;

insert into public.loans (
  id, loan_id, borrower_id, principal_amount, interest_rate, start_date, maturity_date, loan_status,
  collateral_description, collateral_estimated_value, risk_rating, notes, created_by
)
values
  (
    '00000000-0000-0000-0000-000000000301',
    'LN-2026-0001',
    '00000000-0000-0000-0000-000000000201',
    125000.00, 9.75, '2026-01-10', '2028-01-10', 'ACTIVE',
    'Commercial kitchen equipment', 150000.00, 'MEDIUM', 'On-time payment history',
    '00000000-0000-0000-0000-000000000101'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    'LN-2026-0002',
    '00000000-0000-0000-0000-000000000202',
    85000.00, 11.25, '2026-02-01', '2027-08-01', 'UNDER_REVIEW',
    'Warehouse inventory', 97000.00, 'HIGH', 'Pending final underwriting documents',
    '00000000-0000-0000-0000-000000000101'
  )
on conflict (loan_id) do nothing;

insert into public.loan_payments (loan_id, payment_amount, payment_type, payment_date, recorded_by, notes)
values
  ('00000000-0000-0000-0000-000000000301', 2200.00, 'INTEREST', '2026-02-10', '00000000-0000-0000-0000-000000000101', 'Monthly interest'),
  ('00000000-0000-0000-0000-000000000301', 1800.00, 'PRINCIPAL', '2026-02-10', '00000000-0000-0000-0000-000000000101', 'Extra principal reduction');

insert into public.investors (
  id, full_name, phone, email, address, total_capital_invested, available_balance, total_returns_earned, status, created_by
)
values
  (
    '00000000-0000-0000-0000-000000000401',
    'Ava Holdings', '+1-555-0201', 'ava.holdings@example.com', '1 Market St, Houston, TX',
    500000.00, 180000.00, 24000.00, 'ACTIVE', '00000000-0000-0000-0000-000000000101'
  ),
  (
    '00000000-0000-0000-0000-000000000402',
    'Lucas Ventures', '+1-555-0202', 'lucas.v@example.com', '920 Bay Rd, San Diego, CA',
    320000.00, 120000.00, 17000.00, 'ACTIVE', '00000000-0000-0000-0000-000000000101'
  )
on conflict (email) do nothing;

insert into public.investor_transactions (
  investor_id, loan_id, amount, transaction_type, transaction_date, notes, created_by
)
values
  ('00000000-0000-0000-0000-000000000401', null, 120000.00, 'DEPOSIT', '2026-01-05', 'Initial funding tranche', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 80000.00, 'LOAN_ALLOCATION', '2026-01-12', 'Allocated to LN-2026-0001', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000402', null, 90000.00, 'DEPOSIT', '2026-01-18', 'Quarterly capital addition', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000301', 3500.00, 'RETURN_PAYMENT', '2026-02-11', 'Interest distribution', '00000000-0000-0000-0000-000000000101');
