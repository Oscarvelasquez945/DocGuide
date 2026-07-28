create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

grant select on table public.admin_users to authenticated;

create policy "Admins can identify their own admin membership"
on public.admin_users
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where admin_users.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.list_doctors_for_review(
  p_filter text default 'pending'
)
returns table (
  doctor_id uuid,
  full_name text,
  email text,
  identity_number text,
  specialty text,
  office_address text,
  is_active boolean,
  is_verified boolean,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  select
    doctor.user_id,
    trim(concat_ws(' ', profile.first_name, profile.last_name)),
    auth_user.email::text,
    doctor.identity_number,
    doctor.specialty,
    doctor.office_address,
    doctor.is_active,
    doctor.is_verified,
    doctor.created_at
  from public.doctor_profiles as doctor
  join public.profiles as profile on profile.id = doctor.user_id
  join auth.users as auth_user on auth_user.id = doctor.user_id
  where
    case p_filter
      when 'verified' then doctor.is_verified
      when 'inactive' then not doctor.is_active
      when 'all' then true
      else not doctor.is_verified and doctor.is_active
    end
  order by doctor.created_at desc;
end;
$$;

create or replace function public.set_doctor_review_status(
  p_doctor_id uuid,
  p_verified boolean,
  p_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.doctor_profiles
  set
    is_verified = p_verified,
    is_active = p_active
  where user_id = p_doctor_id;

  if not found then
    raise exception 'Doctor profile not found';
  end if;
end;
$$;

revoke all on function public.list_doctors_for_review(text) from public;
grant execute on function public.list_doctors_for_review(text) to authenticated;

revoke all on function public.set_doctor_review_status(uuid, boolean, boolean)
  from public;
grant execute on function public.set_doctor_review_status(uuid, boolean, boolean)
  to authenticated;
