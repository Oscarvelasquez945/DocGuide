create function public.upsert_doctor_profile(
  p_identity_number text,
  p_specialty text,
  p_office_latitude double precision,
  p_office_longitude double precision,
  p_office_address text,
  p_biography text,
  p_experience_years integer,
  p_phone_is_public boolean,
  p_services_offered text
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
    services_offered,
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
    nullif(trim(p_services_offered), ''),
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
    services_offered = excluded.services_offered,
    experience_years = excluded.experience_years,
    office_address = excluded.office_address,
    office_location = excluded.office_location,
    phone_is_public = excluded.phone_is_public;
end;
$$;

revoke all on function public.upsert_doctor_profile(
  text,
  text,
  double precision,
  double precision,
  text,
  text,
  integer,
  boolean,
  text
) from public;

grant execute on function public.upsert_doctor_profile(
  text,
  text,
  double precision,
  double precision,
  text,
  text,
  integer,
  boolean,
  text
) to authenticated;
