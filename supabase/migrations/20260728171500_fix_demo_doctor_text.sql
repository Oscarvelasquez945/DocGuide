-- Repair demo records that were initially inserted through a Windows console
-- with a legacy character encoding.
update public.profiles
set first_name = 'Mónica', last_name = 'Castillos'
where id = '9fa69f6c-45b7-48c5-9615-9b945ef9cbcd';

update public.doctor_profiles
set specialty = 'Cardiología'
where user_id = '9fa69f6c-45b7-48c5-9615-9b945ef9cbcd';

update public.profiles
set first_name = 'Ana Lucía', last_name = 'Méndez'
where id = 'fe27b29a-71db-43ca-90cb-081b008a2fcb';

update public.profiles
set first_name = 'Mario', last_name = 'Rodríguez'
where id = 'b27d8cb3-c4bd-4085-a614-4d31d0b2acf2';

update public.doctor_profiles
set specialty = 'Dermatología'
where user_id = 'b27d8cb3-c4bd-4085-a614-4d31d0b2acf2';

update public.doctor_profiles
set specialty = 'Nutrición'
where user_id = '3800e812-c675-44a0-b22a-c6a25036b428';
