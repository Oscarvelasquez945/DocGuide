-- DocGuide initial backend
-- Authentication is managed by Supabase Auth. This migration owns only
-- application profiles, doctor discovery, and Vitali conversations.

create extension if not exists postgis with schema extensions;

create type public.user_role as enum ('doctor', 'patient');
create type public.gender_type as enum ('male', 'female');
create type public.message_sender as enum ('user', 'assistant');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  first_name text,
  last_name text,
  phone text,
  gender public.gender_type,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_first_name_length check (char_length(first_name) <= 80),
  constraint profiles_last_name_length check (char_length(last_name) <= 80),
  constraint profiles_phone_length check (char_length(phone) <= 30)
);

create table public.doctor_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  identity_number text not null unique,
  specialty text not null,
  biography text,
  experience_years integer,
  office_address text,
  office_location extensions.geography(point, 4326) not null,
  is_active boolean not null default true,
  is_verified boolean not null default false,
  phone_is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_identity_length check (
    char_length(identity_number) between 5 and 40
  ),
  constraint doctor_specialty_length check (
    char_length(specialty) between 2 and 100
  ),
  constraint doctor_experience_valid check (
    experience_years is null or experience_years between 0 and 80
  )
);

create index doctor_profiles_office_location_idx
  on public.doctor_profiles
  using gist (office_location);

create index doctor_profiles_discovery_idx
  on public.doctor_profiles (is_verified, is_active, specialty);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva conversación',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_title_length check (
    char_length(title) between 1 and 120
  )
);

create index conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null
    references public.conversations(id) on delete cascade,
  sender public.message_sender not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint messages_content_length check (
    char_length(content) between 1 and 12000
  )
);

create index messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger doctor_profiles_set_updated_at
before update on public.doctor_profiles
for each row execute function public.set_updated_at();

create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role public.user_role;
begin
  requested_role :=
    case
      when new.raw_user_meta_data ->> 'role' = 'doctor'
        then 'doctor'::public.user_role
      else 'patient'::public.user_role
    end;

  insert into public.profiles (
    id,
    role,
    first_name,
    last_name,
    phone,
    gender
  )
  values (
    new.id,
    requested_role,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    case
      when new.raw_user_meta_data ->> 'gender' in ('male', 'female')
        then (new.raw_user_meta_data ->> 'gender')::public.gender_type
      else null
    end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.upsert_doctor_profile(
  p_identity_number text,
  p_specialty text,
  p_office_latitude double precision,
  p_office_longitude double precision,
  p_office_address text default null,
  p_biography text default null,
  p_experience_years integer default null,
  p_phone_is_public boolean default false
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'doctor'
  ) then
    raise exception 'Only doctor accounts can create doctor profiles';
  end if;

  if p_office_latitude not between -90 and 90
    or p_office_longitude not between -180 and 180 then
    raise exception 'Invalid office coordinates';
  end if;

  insert into public.doctor_profiles (
    user_id,
    identity_number,
    specialty,
    biography,
    experience_years,
    office_address,
    office_location,
    phone_is_public
  )
  values (
    (select auth.uid()),
    trim(p_identity_number),
    trim(p_specialty),
    nullif(trim(p_biography), ''),
    p_experience_years,
    nullif(trim(p_office_address), ''),
    extensions.st_setsrid(
      extensions.st_makepoint(p_office_longitude, p_office_latitude),
      4326
    )::extensions.geography,
    p_phone_is_public
  )
  on conflict (user_id) do update
  set
    identity_number = excluded.identity_number,
    specialty = excluded.specialty,
    biography = excluded.biography,
    experience_years = excluded.experience_years,
    office_address = excluded.office_address,
    office_location = excluded.office_location,
    phone_is_public = excluded.phone_is_public;
end;
$$;

create or replace function public.nearby_doctors(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer default 5000,
  p_specialty text default null
)
returns table (
  doctor_id uuid,
  full_name text,
  specialty text,
  biography text,
  experience_years integer,
  office_address text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  public_phone text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    doctor.user_id as doctor_id,
    trim(concat_ws(' ', profile.first_name, profile.last_name)) as full_name,
    doctor.specialty,
    doctor.biography,
    doctor.experience_years,
    doctor.office_address,
    extensions.st_y(doctor.office_location::extensions.geometry) as latitude,
    extensions.st_x(doctor.office_location::extensions.geometry) as longitude,
    extensions.st_distance(
      doctor.office_location,
      extensions.st_setsrid(
        extensions.st_makepoint(p_longitude, p_latitude),
        4326
      )::extensions.geography
    ) as distance_meters,
    case when doctor.phone_is_public then profile.phone else null end
      as public_phone
  from public.doctor_profiles as doctor
  join public.profiles as profile on profile.id = doctor.user_id
  where doctor.is_active
    and doctor.is_verified
    and p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and p_radius_meters between 100 and 50000
    and (
      p_specialty is null
      or doctor.specialty ilike '%' || trim(p_specialty) || '%'
    )
    and extensions.st_dwithin(
      doctor.office_location,
      extensions.st_setsrid(
        extensions.st_makepoint(p_longitude, p_latitude),
        4326
      )::extensions.geography,
      p_radius_meters
    )
  order by distance_meters asc
  limit 50;
$$;

alter table public.profiles enable row level security;
alter table public.doctor_profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Doctors can read their own professional profile"
on public.doctor_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Doctors can create their own professional profile"
on public.doctor_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'doctor'
  )
);

create policy "Doctors can update their own professional profile"
on public.doctor_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their conversations"
on public.conversations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their conversations"
on public.conversations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their conversations"
on public.conversations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their conversations"
on public.conversations
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read messages from their conversations"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
  )
);

create policy "Users can add messages to their conversations"
on public.messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and conversations.user_id = (select auth.uid())
  )
);

revoke all on function public.upsert_doctor_profile(
  text,
  text,
  double precision,
  double precision,
  text,
  text,
  integer,
  boolean
) from public;

grant execute on function public.upsert_doctor_profile(
  text,
  text,
  double precision,
  double precision,
  text,
  text,
  integer,
  boolean
) to authenticated;

revoke all on function public.nearby_doctors(
  double precision,
  double precision,
  integer,
  text
) from public;

grant execute on function public.nearby_doctors(
  double precision,
  double precision,
  integer,
  text
) to authenticated;
