-- Garante coluna password (restores antigos) e documenta hash bcrypt(demo123).
alter table public.users
  add column if not exists password varchar(255) not null default '';

-- Hash bcrypt cost 10 de 'demo123' (só onde ainda está vazio ou literal demo123).
update public.users
set password = '$2a$10$AldGCcG5DJfcj5ebSfdzE.1vFGWv1gOgkByUkUfVr3VxlSjvI3Xdm'
where password = '' or password = 'demo123';

notify pgrst, 'reload schema';