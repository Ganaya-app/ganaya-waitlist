-- =====================================================================
-- GanáYa MVP — Schema completo
-- =====================================================================
-- Versión: v1.0 (MVP)
-- Notas:
--   - Ledger: single-entry con estados (pending/available/reserved/settled)
--   - Polimorfismo en wallet_transactions vía reference_type + reference_id
--   - RLS estricto: users solo ven sus datos, admins ven todo
--   - Indexes en columnas de filtrado frecuente y joins
-- =====================================================================

-- =====================================================================
-- 0. EXTENSIONS
-- =====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type user_role as enum ('user', 'admin');
create type kyc_status as enum ('not_started', 'submitted', 'approved', 'rejected');

create type offer_source_type as enum ('manual_subsidized', 'manual_affiliate', 'api_postback');
create type offer_completion_method as enum ('screenshot_review', 'postback', 'manual_admin_approval', 'click_then_self_report');
create type offer_status as enum ('draft', 'active', 'paused', 'expired');

create type completion_status as enum (
  'clicked',
  'submitted',
  'pending_review',
  'approved',
  'confirmed',
  'rejected',
  'reversed'
);

create type wallet_tx_type as enum (
  'completion_credit',
  'completion_hold_release',
  'completion_reversal',
  'redemption_reservation',
  'redemption_debit',
  'redemption_refund',
  'referral_bonus',
  'adjustment'
);

create type wallet_tx_status as enum ('pending', 'available', 'reserved', 'settled');

create type redemption_method as enum ('mercadopago');
create type redemption_status as enum (
  'pending_kyc',
  'kyc_approved',
  'processing',
  'completed',
  'failed',
  'retry',
  'cancelled'
);

create type fraud_severity as enum ('low', 'medium', 'high', 'critical');
create type referral_status as enum ('pending', 'activated');

-- =====================================================================
-- 2. PROFILES (extiende auth.users)
-- =====================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  email text,
  whatsapp_verified boolean not null default false,

  role user_role not null default 'user',

  kyc_status kyc_status not null default 'not_started',
  kyc_documents jsonb,
  kyc_reviewed_by uuid references profiles(id),
  kyc_reviewed_at timestamptz,
  kyc_rejection_reason text,

  mp_alias text,

  waitlist_cohort integer,
  signup_answers jsonb,

  referral_code text unique not null,
  referred_by_code text,

  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_phone on profiles(phone);
create index idx_profiles_referral_code on profiles(referral_code);
create index idx_profiles_referred_by on profiles(referred_by_code);
create index idx_profiles_kyc_status on profiles(kyc_status) where kyc_status = 'submitted';

-- =====================================================================
-- 3. OFFERS
-- =====================================================================

create table offers (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  instructions text,

  reward_amount_ars numeric(12, 2) not null,
  cost_ars numeric(12, 2) not null,

  source_type offer_source_type not null,
  source_provider text,
  external_offer_id text,

  completion_method offer_completion_method not null,
  target_url text,
  postback_secret text,

  icon_url text,
  category text not null,
  status offer_status not null default 'draft',

  max_completions_per_user integer not null default 1,
  hold_period_days integer not null default 2,

  starts_at timestamptz,
  ends_at timestamptz,

  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_offers_status on offers(status) where status = 'active';
create index idx_offers_category on offers(category);
create index idx_offers_source_type on offers(source_type);
create index idx_offers_external_id on offers(source_provider, external_offer_id) where external_offer_id is not null;

-- =====================================================================
-- 4. OFFER_COMPLETIONS
-- =====================================================================

create table offer_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  offer_id uuid not null references offers(id),

  status completion_status not null default 'clicked',
  reward_amount_ars numeric(12, 2) not null,

  external_transaction_id text,
  submission_data jsonb,
  click_ip inet,
  click_user_agent text,

  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,

  approved_at timestamptz,
  hold_until timestamptz,
  confirmed_at timestamptz,

  reversed_at timestamptz,
  reverse_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_reward_positive check (reward_amount_ars > 0)
);

create index idx_completions_user on offer_completions(user_id);
create index idx_completions_offer on offer_completions(offer_id);
create index idx_completions_status on offer_completions(status);
create index idx_completions_hold_until on offer_completions(hold_until) where status = 'approved';
create index idx_completions_external_id on offer_completions(external_transaction_id) where external_transaction_id is not null;

-- =====================================================================
-- 5. WALLET_TRANSACTIONS (ledger contable single-entry con estados)
-- =====================================================================

create table wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,

  amount_ars numeric(12, 2) not null,
  type wallet_tx_type not null,
  status wallet_tx_status not null,

  reference_type text not null,
  reference_id uuid,

  description text not null,
  metadata jsonb,

  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_wallet_user on wallet_transactions(user_id);
create index idx_wallet_user_status on wallet_transactions(user_id, status);
create index idx_wallet_reference on wallet_transactions(reference_type, reference_id);
create index idx_wallet_created on wallet_transactions(created_at desc);

-- =====================================================================
-- 6. REDEMPTIONS
-- =====================================================================

create table redemptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,

  amount_ars numeric(12, 2) not null,
  method redemption_method not null default 'mercadopago',
  destination text not null,

  status redemption_status not null default 'pending_kyc',

  idempotency_key uuid not null unique default uuid_generate_v4(),

  external_transaction_id text,
  failure_reason text,
  retry_count integer not null default 0,
  next_retry_at timestamptz,

  processed_by uuid references profiles(id),
  completed_at timestamptz,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chk_amount_min check (amount_ars >= 2000),
  constraint chk_amount_positive check (amount_ars > 0)
);

create index idx_redemptions_user on redemptions(user_id);
create index idx_redemptions_status on redemptions(status);
create index idx_redemptions_retry on redemptions(next_retry_at) where status = 'retry';

-- =====================================================================
-- 7. REFERRALS
-- =====================================================================

create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references profiles(id),
  referred_id uuid not null references profiles(id),

  status referral_status not null default 'pending',
  activated_at timestamptz,

  reward_amount_ars numeric(12, 2) not null default 500,
  reward_credited boolean not null default false,

  created_at timestamptz not null default now(),

  unique(referrer_id, referred_id)
);

create index idx_referrals_referrer on referrals(referrer_id);
create index idx_referrals_referred on referrals(referred_id);
create index idx_referrals_status on referrals(status);

-- =====================================================================
-- 8. ANTI-FRAUD
-- =====================================================================

create table anti_fraud_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  event_type text not null,
  severity fraud_severity not null,
  metadata jsonb,
  resolved boolean not null default false,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now()
);

create index idx_fraud_user on anti_fraud_events(user_id);
create index idx_fraud_unresolved on anti_fraud_events(severity, created_at desc) where resolved = false;

create table device_fingerprints (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  fingerprint_hash text not null,
  ip_address inet,
  user_agent text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index idx_fingerprints_hash on device_fingerprints(fingerprint_hash);
create index idx_fingerprints_user on device_fingerprints(user_id);

-- =====================================================================
-- 9. ADMIN AUDIT LOG
-- =====================================================================

create table admin_actions (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references profiles(id),
  action_type text not null,
  target_table text not null,
  target_id uuid not null,
  notes text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_admin_actions_admin on admin_actions(admin_id);
create index idx_admin_actions_target on admin_actions(target_table, target_id);
create index idx_admin_actions_created on admin_actions(created_at desc);

-- =====================================================================
-- 10. FUNCIONES DE BALANCE
-- =====================================================================

create or replace function get_available_balance(p_user_id uuid)
returns numeric(12, 2)
language sql
stable
as $$
  select coalesce(sum(amount_ars), 0)
  from wallet_transactions
  where user_id = p_user_id
    and status = 'available';
$$;

create or replace function get_pending_balance(p_user_id uuid)
returns numeric(12, 2)
language sql
stable
as $$
  select coalesce(sum(amount_ars), 0)
  from wallet_transactions
  where user_id = p_user_id
    and status = 'pending';
$$;

create or replace function get_reserved_balance(p_user_id uuid)
returns numeric(12, 2)
language sql
stable
as $$
  select coalesce(sum(amount_ars), 0)
  from wallet_transactions
  where user_id = p_user_id
    and status = 'reserved';
$$;

-- =====================================================================
-- 11. RLS POLICIES
-- =====================================================================

alter table profiles enable row level security;
alter table offers enable row level security;
alter table offer_completions enable row level security;
alter table wallet_transactions enable row level security;
alter table redemptions enable row level security;
alter table referrals enable row level security;
alter table anti_fraud_events enable row level security;
alter table device_fingerprints enable row level security;
alter table admin_actions enable row level security;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Admins read all profiles" on profiles
  for select using (is_admin());
create policy "Admins update all profiles" on profiles
  for update using (is_admin());

create policy "Anyone reads active offers" on offers
  for select using (status = 'active');
create policy "Admins manage offers" on offers
  for all using (is_admin());

create policy "Users read own completions" on offer_completions
  for select using (auth.uid() = user_id);
create policy "Users insert own completions" on offer_completions
  for insert with check (auth.uid() = user_id);
create policy "Admins manage all completions" on offer_completions
  for all using (is_admin());

create policy "Users read own transactions" on wallet_transactions
  for select using (auth.uid() = user_id);
create policy "Admins manage all transactions" on wallet_transactions
  for all using (is_admin());

create policy "Users read own redemptions" on redemptions
  for select using (auth.uid() = user_id);
create policy "Users create own redemptions" on redemptions
  for insert with check (auth.uid() = user_id);
create policy "Admins manage all redemptions" on redemptions
  for all using (is_admin());

create policy "Users read own referrals" on referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);
create policy "Admins manage referrals" on referrals
  for all using (is_admin());

create policy "Admins read fraud events" on anti_fraud_events
  for select using (is_admin());
create policy "Admins manage fraud events" on anti_fraud_events
  for all using (is_admin());

create policy "Admins read fingerprints" on device_fingerprints
  for select using (is_admin());
create policy "Admins manage fingerprints" on device_fingerprints
  for all using (is_admin());

create policy "Admins read audit log" on admin_actions
  for select using (is_admin());
create policy "Admins insert audit log" on admin_actions
  for insert with check (is_admin());

-- =====================================================================
-- 12. TRIGGERS DE updated_at
-- =====================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_offers_updated_at before update on offers
  for each row execute function set_updated_at();
create trigger trg_completions_updated_at before update on offer_completions
  for each row execute function set_updated_at();
create trigger trg_redemptions_updated_at before update on redemptions
  for each row execute function set_updated_at();
