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
    doctor.user_id,
    trim(concat_ws(' ', profile.first_name, profile.last_name)),
    doctor.specialty,
    doctor.biography,
    doctor.experience_years,
    doctor.office_address,
    extensions.st_y(doctor.office_location::extensions.geometry),
    extensions.st_x(doctor.office_location::extensions.geometry),
    extensions.st_distance(
      doctor.office_location,
      extensions.st_setsrid(
        extensions.st_makepoint(p_longitude, p_latitude), 4326
      )::extensions.geography
    ),
    case when doctor.phone_is_public then profile.phone else null end
  from public.doctor_profiles as doctor
  join public.profiles as profile on profile.id = doctor.user_id
  where doctor.is_active
    and doctor.is_verified
    and p_latitude between -90 and 90
    and p_longitude between -180 and 180
    and p_radius_meters between 100 and 500000
    and (
      p_specialty is null
      or doctor.specialty ilike '%' || trim(p_specialty) || '%'
    )
    and extensions.st_dwithin(
      doctor.office_location,
      extensions.st_setsrid(
        extensions.st_makepoint(p_longitude, p_latitude), 4326
      )::extensions.geography,
      p_radius_meters
    )
  order by 9 asc
  limit 50;
$$;
