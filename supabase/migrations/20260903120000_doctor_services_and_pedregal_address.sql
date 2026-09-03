alter table public.doctor_profiles
  add column if not exists services_offered text;

alter table public.doctor_profiles
  drop constraint if exists doctor_services_offered_length;

alter table public.doctor_profiles
  add constraint doctor_services_offered_length check (
    services_offered is null or char_length(services_offered) <= 1000
  );

update public.doctor_profiles
set office_address = 'Residencial El Pedregal, San Pedro Sula'
where identity_number = 'SPS-DEMO-009';

update public.doctor_profiles
set services_offered = case specialty
  when 'Cardiología' then 'Consulta cardiovascular, electrocardiograma y control de hipertensión.'
  when 'Medicina General' then 'Consulta general, chequeo preventivo y seguimiento de enfermedades crónicas.'
  when 'Pediatría' then 'Consulta pediátrica, control del niño sano y seguimiento del crecimiento.'
  when 'Dermatología' then 'Consulta dermatológica, revisión de lunares y tratamiento de acné.'
  when 'Ginecología' then 'Consulta ginecológica, control preventivo y orientación en salud femenina.'
  when 'Ortopedia' then 'Evaluación musculoesquelética, lesiones deportivas y seguimiento ortopédico.'
  when 'Psicología' then 'Evaluación psicológica, terapia individual y orientación emocional.'
  when 'Neurología' then 'Consulta neurológica y evaluación de cefaleas y trastornos neurológicos.'
  when 'Oftalmología' then 'Evaluación visual, examen ocular y seguimiento oftalmológico.'
  when 'Otorrinolaringología' then 'Evaluación de oído, nariz y garganta y pruebas auditivas básicas.'
  else services_offered
end
where identity_number like 'SPS-DEMO-%'
  and services_offered is null;

drop function if exists public.nearby_doctors(
  double precision,
  double precision,
  integer,
  text
);

create function public.nearby_doctors(
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
  services_offered text,
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
    doctor.services_offered,
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
  order by 10 asc
  limit 50;
$$;

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
