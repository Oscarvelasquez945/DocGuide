-- Explicit Data API grants. RLS remains the final authorization layer.

grant select, update
  on table public.profiles
  to authenticated;

grant select, insert, update
  on table public.doctor_profiles
  to authenticated;

grant select, insert, update, delete
  on table public.conversations
  to authenticated;

grant select, insert
  on table public.messages
  to authenticated;

grant usage, select
  on sequence public.messages_id_seq
  to authenticated;

revoke all
  on table public.profiles,
           public.doctor_profiles,
           public.conversations,
           public.messages
  from anon;
