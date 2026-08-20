-- =========================================================
-- STUDIO NAYUMI SIQUEIRA
-- Supabase / PostgreSQL
-- Schema principal
-- =========================================================

create extension if not exists btree_gist;
create extension if not exists pgcrypto;

-- =========================================================
-- CONFIGURAÇÕES DO STUDIO
-- =========================================================

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Studio Nayumi Siqueira',
  subtitle text default 'Nails & Lash',
  phone text,
  instagram text,
  address text,
  primary_color text default '#b78b7d',
  hero_color text default '#efe2d8',
  profile_image_url text,
  logo_url text,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- SERVIÇOS
-- =========================================================

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 60
    check (duration_minutes > 0),
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- PROFISSIONAIS
-- =========================================================

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bio text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.professional_services (
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  service_id uuid not null
    references public.services(id) on delete cascade,
  primary key (professional_id, service_id)
);

-- =========================================================
-- HORÁRIOS DE TRABALHO
-- weekday:
-- 0 = domingo
-- 1 = segunda
-- ...
-- 6 = sábado
-- =========================================================

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  weekday integer not null
    check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  check (end_time > start_time)
);

create index if not exists working_hours_professional_idx
on public.working_hours(professional_id, weekday);

-- =========================================================
-- BLOQUEIOS DE HORÁRIO
-- =========================================================

create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_datetime > start_datetime)
);

create index if not exists blocked_times_professional_idx
on public.blocked_times(professional_id, start_datetime);

-- =========================================================
-- AGENDAMENTOS
-- =========================================================

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),

  client_name text not null,
  client_phone text not null,
  client_email text,

  service_id uuid not null
    references public.services(id),

  professional_id uuid not null
    references public.professionals(id),

  start_datetime timestamptz not null,
  end_datetime timestamptz not null,

  price numeric(10,2) not null default 0,

  status text not null default 'confirmed'
    check (
      status in (
        'pending',
        'confirmed',
        'completed',
        'cancelled',
        'no_show'
      )
    ),

  notes text,
  source text not null default 'site',

  created_at timestamptz not null default now(),

  check (end_datetime > start_datetime)
);

create index if not exists appointments_professional_idx
on public.appointments(professional_id, start_datetime);

create index if not exists appointments_date_idx
on public.appointments(start_datetime);

-- Impede duas clientes no mesmo horário para a mesma profissional.

alter table public.appointments
drop constraint if exists appointments_no_overlap;

alter table public.appointments
add constraint appointments_no_overlap
exclude using gist (
  professional_id with =,
  tstzrange(
    start_datetime,
    end_datetime,
    '[)'
  ) with &&
)
where (status <> 'cancelled');

-- =========================================================
-- FINANCEIRO
-- =========================================================

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),

  type text not null
    check (type in ('entrada', 'saida')),

  amount numeric(10,2) not null
    check (amount >= 0),

  category text,
  description text,

  transaction_date date not null default current_date,

  appointment_id uuid unique
    references public.appointments(id) on delete set null,

  professional_id uuid
    references public.professionals(id) on delete set null,

  payment_method text,

  status text not null default 'realizado',

  created_at timestamptz not null default now()
);

-- =========================================================
-- GALERIA
-- =========================================================

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- FAQ
-- =========================================================

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  sort_order integer not null default 0
);

-- =========================================================
-- INTEGRAÇÕES
-- =========================================================

create table if not exists public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text unique not null,
  status text not null default 'nao_conectado',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- ADMINISTRADORES
-- =========================================================

create table if not exists public.admin_profiles (
  user_id uuid primary key
    references auth.users(id) on delete cascade,

  created_at timestamptz not null default now()
);

-- Retorna true quando o usuário atual é administrador.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

-- Permite que o PRIMEIRO usuário autenticado se torne administrador.
-- Depois que existir um admin, usuários comuns não conseguem se promover.

create or replace function public.claim_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin

  if auth.uid() is null then
    return false;
  end if;

  if exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.admin_profiles
  ) then
    return false;
  end if;

  insert into public.admin_profiles(user_id)
  values (auth.uid())
  on conflict do nothing;

  return true;

end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.claim_admin() to authenticated;

-- =========================================================
-- HORÁRIOS DISPONÍVEIS
-- =========================================================

create or replace function public.get_available_slots(
  p_service_id uuid,
  p_professional_id uuid,
  p_date date
)
returns table (
  slot_time time
)
language plpgsql
security definer
set search_path = public
as $$
declare

  v_duration integer;

  v_open time;
  v_close time;

  v_slot time;

  v_start timestamptz;
  v_end timestamptz;

begin

  select duration_minutes
  into v_duration
  from public.services
  where id = p_service_id
    and active = true;

  if v_duration is null then
    return;
  end if;

  if not exists (
    select 1
    from public.professionals
    where id = p_professional_id
      and active = true
  ) then
    return;
  end if;

  if not exists (
    select 1
    from public.professional_services
    where professional_id = p_professional_id
      and service_id = p_service_id
  ) then
    return;
  end if;

  select start_time, end_time
  into v_open, v_close
  from public.working_hours
  where professional_id = p_professional_id
    and weekday = extract(dow from p_date)::integer
    and active = true
  order by start_time
  limit 1;

  if v_open is null or v_close is null then
    return;
  end if;

  v_slot := v_open;

  while
    v_slot + make_interval(mins => v_duration)
    <= v_close
  loop

    v_start :=
      (p_date + v_slot)
      at time zone 'America/Sao_Paulo';

    v_end :=
      v_start
      + make_interval(mins => v_duration);

    if
      v_start > now()

      and not exists (
        select 1
        from public.appointments a
        where a.professional_id = p_professional_id
          and a.status <> 'cancelled'
          and tstzrange(
            a.start_datetime,
            a.end_datetime,
            '[)'
          ) && tstzrange(
            v_start,
            v_end,
            '[)'
          )
      )

      and not exists (
        select 1
        from public.blocked_times b
        where b.professional_id = p_professional_id
          and tstzrange(
            b.start_datetime,
            b.end_datetime,
            '[)'
          ) && tstzrange(
            v_start,
            v_end,
            '[)'
          )
      )

    then
      slot_time := v_slot;
      return next;
    end if;

    -- Intervalos de 30 minutos.
    v_slot := v_slot + interval '30 minutes';

  end loop;

end;
$$;

grant execute
on function public.get_available_slots(uuid, uuid, date)
to anon, authenticated;

-- =========================================================
-- CRIAR AGENDAMENTO
-- =========================================================

create or replace function public.book_appointment(
  p_service_id uuid,
  p_professional_id uuid,
  p_date date,
  p_time time,
  p_client_name text,
  p_client_phone text,
  p_client_email text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare

  v_duration integer;
  v_price numeric(10,2);

  v_start timestamptz;
  v_end timestamptz;

  v_id uuid;

begin

  if
    trim(coalesce(p_client_name, '')) = ''
    or trim(coalesce(p_client_phone, '')) = ''
  then
    raise exception 'Nome e telefone são obrigatórios.';
  end if;

  select
    duration_minutes,
    price
  into
    v_duration,
    v_price
  from public.services
  where id = p_service_id
    and active = true;

  if v_duration is null then
    raise exception 'Serviço indisponível.';
  end if;

  if not exists (
    select 1
    from public.professionals
    where id = p_professional_id
      and active = true
  ) then
    raise exception 'Profissional indisponível.';
  end if;

  if not exists (
    select 1
    from public.professional_services
    where professional_id = p_professional_id
      and service_id = p_service_id
  ) then
    raise exception 'Profissional não realiza este serviço.';
  end if;

  if not exists (
    select 1
    from public.working_hours
    where professional_id = p_professional_id
      and weekday = extract(dow from p_date)::integer
      and active = true
      and p_time >= start_time
      and
      p_time + make_interval(mins => v_duration)
      <= end_time
  ) then
    raise exception 'Horário fora do expediente.';
  end if;

  v_start :=
    (p_date + p_time)
    at time zone 'America/Sao_Paulo';

  v_end :=
    v_start
    + make_interval(mins => v_duration);

  if v_start <= now() then
    raise exception 'Não é possível agendar no passado.';
  end if;

  if exists (
    select 1
    from public.blocked_times b
    where b.professional_id = p_professional_id
      and tstzrange(
        b.start_datetime,
        b.end_datetime,
        '[)'
      ) && tstzrange(
        v_start,
        v_end,
        '[)'
      )
  ) then
    raise exception 'Este horário está bloqueado.';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.professional_id = p_professional_id
      and a.status <> 'cancelled'
      and tstzrange(
        a.start_datetime,
        a.end_datetime,
        '[)'
      ) && tstzrange(
        v_start,
        v_end,
        '[)'
      )
  ) then
    raise exception 'Este horário já foi reservado.';
  end if;

  insert into public.appointments (
    client_name,
    client_phone,
    client_email,
    service_id,
    professional_id,
    start_datetime,
    end_datetime,
    price,
    status,
    notes,
    source
  )
  values (
    trim(p_client_name),
    trim(p_client_phone),
    nullif(trim(coalesce(p_client_email, '')), ''),
    p_service_id,
    p_professional_id,
    v_start,
    v_end,
    v_price,
    'confirmed',
    nullif(trim(coalesce(p_notes, '')), ''),
    'site'
  )
  returning id into v_id;

  return v_id;

exception

  when exclusion_violation then
    raise exception 'Este horário acabou de ser reservado. Escolha outro horário.';

end;
$$;

grant execute
on function public.book_appointment(
  uuid,
  uuid,
  date,
  time,
  text,
  text,
  text,
  text
)
to anon, authenticated;

-- =========================================================
-- RLS - SEGURANÇA
-- =========================================================

alter table public.business_settings enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.blocked_times enable row level security;
alter table public.appointments enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.gallery_items enable row level security;
alter table public.faq_items enable row level security;
alter table public.integration_settings enable row level security;
alter table public.admin_profiles enable row level security;

-- Remove políticas antigas caso o SQL seja executado novamente.

drop policy if exists public_read_business_settings
on public.business_settings;

drop policy if exists public_read_services
on public.services;

drop policy if exists public_read_professionals
on public.professionals;

drop policy if exists public_read_professional_services
on public.professional_services;

drop policy if exists public_read_working_hours
on public.working_hours;

drop policy if exists public_read_gallery
on public.gallery_items;

drop policy if exists public_read_faq
on public.faq_items;

drop policy if exists admin_business_settings
on public.business_settings;

drop policy if exists admin_services
on public.services;

drop policy if exists admin_professionals
on public.professionals;

drop policy if exists admin_professional_services
on public.professional_services;

drop policy if exists admin_working_hours
on public.working_hours;

drop policy if exists admin_blocked_times
on public.blocked_times;

drop policy if exists admin_appointments
on public.appointments;

drop policy if exists admin_financial
on public.financial_transactions;

drop policy if exists admin_gallery
on public.gallery_items;

drop policy if exists admin_faq
on public.faq_items;

drop policy if exists admin_integrations
on public.integration_settings;

drop policy if exists admin_profiles_self
on public.admin_profiles;

-- =========================================================
-- LEITURA PÚBLICA
-- =========================================================

create policy public_read_business_settings
on public.business_settings
for select
to anon, authenticated
using (true);

create policy public_read_services
on public.services
for select
to anon, authenticated
using (active = true);

create policy public_read_professionals
on public.professionals
for select
to anon, authenticated
using (active = true);

create policy public_read_professional_services
on public.professional_services
for select
to anon, authenticated
using (true);

create policy public_read_working_hours
on public.working_hours
for select
to anon, authenticated
using (active = true);

create policy public_read_gallery
on public.gallery_items
for select
to anon, authenticated
using (active = true);

create policy public_read_faq
on public.faq_items
for select
to anon, authenticated
using (active = true);

-- =========================================================
-- ACESSO COMPLETO DO ADMIN
-- =========================================================

create policy admin_business_settings
on public.business_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_services
on public.services
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_professionals
on public.professionals
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_professional_services
on public.professional_services
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_working_hours
on public.working_hours
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_blocked_times
on public.blocked_times
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_appointments
on public.appointments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_financial
on public.financial_transactions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_gallery
on public.gallery_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_faq
on public.faq_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_integrations
on public.integration_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy admin_profiles_self
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid());

-- =========================================================
-- DADOS INICIAIS
-- =========================================================

insert into public.business_settings (
  business_name,
  subtitle
)
select
  'Studio Nayumi Siqueira',
  'Nails & Lash'
where not exists (
  select 1
  from public.business_settings
);

-- =========================================================
-- FIM
-- =========================================================
