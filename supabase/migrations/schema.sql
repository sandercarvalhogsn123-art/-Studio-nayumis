-- Studio Nayumi Siqueira - schema base Supabase/Postgres
create extension if not exists btree_gist;

create table if not exists business_settings(id uuid primary key default gen_random_uuid(), name text not null default 'Studio Nayumi Siqueira', subtitle text default 'Nails & Lash', phone text, instagram text, address text, hero_color text default '#efe2d8', logo_url text, updated_at timestamptz default now());
create table if not exists services(id uuid primary key default gen_random_uuid(), name text not null, category text, description text, price numeric(10,2) not null default 0, duration_minutes int not null check(duration_minutes>0), image_url text, active boolean default true, sort_order int default 0);
create table if not exists professionals(id uuid primary key default gen_random_uuid(), name text not null, bio text, image_url text, active boolean default true);
create table if not exists professional_services(professional_id uuid references professionals on delete cascade, service_id uuid references services on delete cascade, primary key(professional_id,service_id));
create table if not exists working_hours(id uuid primary key default gen_random_uuid(), professional_id uuid references professionals on delete cascade, weekday int check(weekday between 0 and 6), start_time time not null, end_time time not null);
create table if not exists blocked_times(id uuid primary key default gen_random_uuid(), professional_id uuid references professionals on delete cascade, start_at timestamptz not null, end_at timestamptz not null, reason text);
create table if not exists appointments(id uuid primary key default gen_random_uuid(), client_name text not null, client_phone text not null, client_email text, service_id uuid references services, professional_id uuid references professionals, start_at timestamptz not null, end_at timestamptz not null, price numeric(10,2) not null default 0, status text not null default 'confirmado' check(status in ('pendente','confirmado','concluido','cancelado','nao_compareceu')), notes text, source text default 'site', created_at timestamptz default now());
-- Impede sobreposição de agendamentos ativos para a mesma profissional
alter table appointments drop constraint if exists appointments_no_overlap;
alter table appointments add constraint appointments_no_overlap exclude using gist (professional_id with =, tstzrange(start_at,end_at,'[)') with &&) where (status <> 'cancelado');
create table if not exists financial_transactions(id uuid primary key default gen_random_uuid(), type text not null check(type in ('entrada','saida')), amount numeric(10,2) not null, category text, description text, occurred_on date not null default current_date, appointment_id uuid unique references appointments on delete set null, professional_id uuid references professionals, payment_method text, status text default 'realizado', created_at timestamptz default now());
create table if not exists gallery_items(id uuid primary key default gen_random_uuid(), image_url text not null, caption text, active boolean default true, sort_order int default 0);
create table if not exists faq_items(id uuid primary key default gen_random_uuid(), question text not null, answer text not null, active boolean default true, sort_order int default 0);
create table if not exists integration_settings(id uuid primary key default gen_random_uuid(), provider text unique not null, status text default 'nao_conectado', config jsonb default '{}'::jsonb, updated_at timestamptz default now());

alter table business_settings enable row level security;alter table services enable row level security;alter table professionals enable row level security;alter table appointments enable row level security;alter table financial_transactions enable row level security;
create policy if not exists public_read_services on services for select using(active=true);
create policy if not exists public_read_professionals on professionals for select using(active=true);
-- Para produção, crie tabela admin_profiles ligada a auth.users e políticas específicas de admin antes de liberar CRUD administrativo.
