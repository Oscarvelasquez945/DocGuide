-- Demo-only doctor catalog for testing discovery around San Pedro Sula.
-- These records are fictional and use non-deliverable docguide.test addresses.

with demo_users (
  id, email, first_name, last_name, phone, gender
) as (
  values
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'sofia.reyes.sps@docguide.test',   'Sofía',   'Reyes',     '+504 2501-1001', 'female'),
    ('a1000000-0000-4000-8000-000000000002'::uuid, 'daniel.pineda.sps@docguide.test', 'Daniel',  'Pineda',    '+504 2501-1002', 'male'),
    ('a1000000-0000-4000-8000-000000000003'::uuid, 'valeria.cruz.sps@docguide.test',  'Valeria', 'Cruz',      '+504 2501-1003', 'female'),
    ('a1000000-0000-4000-8000-000000000004'::uuid, 'andres.meza.sps@docguide.test',   'Andrés',  'Meza',      '+504 2501-1004', 'male'),
    ('a1000000-0000-4000-8000-000000000005'::uuid, 'gabriela.flores.sps@docguide.test','Gabriela','Flores',   '+504 2501-1005', 'female'),
    ('a1000000-0000-4000-8000-000000000006'::uuid, 'ricardo.suazo.sps@docguide.test', 'Ricardo', 'Suazo',     '+504 2501-1006', 'male'),
    ('a1000000-0000-4000-8000-000000000007'::uuid, 'camila.mejia.sps@docguide.test',  'Camila',  'Mejía',     '+504 2501-1007', 'female'),
    ('a1000000-0000-4000-8000-000000000008'::uuid, 'javier.molina.sps@docguide.test', 'Javier',  'Molina',    '+504 2501-1008', 'male'),
    ('a1000000-0000-4000-8000-000000000009'::uuid, 'paola.aguilar.sps@docguide.test', 'Paola',   'Aguilar',   '+504 2501-1009', 'female'),
    ('a1000000-0000-4000-8000-000000000010'::uuid, 'fernando.lagos.sps@docguide.test','Fernando','Lagos',     '+504 2501-1010', 'male')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'role', 'doctor',
    'first_name', first_name,
    'last_name', last_name,
    'phone', phone,
    'gender', gender,
    'demo_account', true
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
from demo_users
on conflict (id) do nothing;

insert into public.doctor_profiles (
  user_id,
  identity_number,
  specialty,
  biography,
  experience_years,
  office_address,
  office_location,
  is_active,
  is_verified,
  phone_is_public
)
values
  (
    'a1000000-0000-4000-8000-000000000001', 'SPS-DEMO-001', 'Cardiología',
    'Perfil ficticio para pruebas de DocGuide. Orientación cardiovascular general.', 12,
    'Barrio Los Andes, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0362, 15.5111), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000002', 'SPS-DEMO-002', 'Medicina General',
    'Perfil ficticio para pruebas de DocGuide. Atención médica general.', 8,
    'Barrio El Centro, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0247, 15.5037), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000003', 'SPS-DEMO-003', 'Pediatría',
    'Perfil ficticio para pruebas de DocGuide. Atención pediátrica general.', 10,
    'Colonia Trejo, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0428, 15.4962), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000004', 'SPS-DEMO-004', 'Dermatología',
    'Perfil ficticio para pruebas de DocGuide. Valoración dermatológica general.', 9,
    'Barrio Río de Piedras, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0310, 15.5088), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000005', 'SPS-DEMO-005', 'Ginecología',
    'Perfil ficticio para pruebas de DocGuide. Orientación en salud femenina.', 14,
    'Colonia Universidad, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0275, 15.5220), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000006', 'SPS-DEMO-006', 'Ortopedia',
    'Perfil ficticio para pruebas de DocGuide. Evaluación musculoesquelética general.', 15,
    'Barrio Paz Barahona, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0189, 15.4984), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000007', 'SPS-DEMO-007', 'Psicología',
    'Perfil ficticio para pruebas de DocGuide. Orientación psicológica general.', 7,
    'Colonia Moderna, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0403, 15.5157), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000008', 'SPS-DEMO-008', 'Neurología',
    'Perfil ficticio para pruebas de DocGuide. Valoración neurológica general.', 13,
    'Colonia Satélite, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0028, 15.5272), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000009', 'SPS-DEMO-009', 'Oftalmología',
    'Perfil ficticio para pruebas de DocGuide. Evaluación de salud visual.', 11,
    'Colonia El Pedregal, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-88.0613, 15.5008), 4326)::extensions.geography,
    true, true, true
  ),
  (
    'a1000000-0000-4000-8000-000000000010', 'SPS-DEMO-010', 'Otorrinolaringología',
    'Perfil ficticio para pruebas de DocGuide. Atención general de oído, nariz y garganta.', 10,
    'Colonia Rivera Hernández, San Pedro Sula',
    extensions.st_setsrid(extensions.st_makepoint(-87.9988, 15.5176), 4326)::extensions.geography,
    true, true, true
  )
on conflict (user_id) do update
set
  identity_number = excluded.identity_number,
  specialty = excluded.specialty,
  biography = excluded.biography,
  experience_years = excluded.experience_years,
  office_address = excluded.office_address,
  office_location = excluded.office_location,
  is_active = excluded.is_active,
  is_verified = excluded.is_verified,
  phone_is_public = excluded.phone_is_public,
  updated_at = now();
