-- ─────────────────────────────────────────────────────────────
--  1-perfis.sql — perfis, função is_admin e lista de admins
--  VHG Planejamento Financeiro · Supabase
--
--  Rode os arquivos na ordem (1, 2, 3, 4, 5), um por vez:
--  SQL Editor > New query > cole o arquivo inteiro > Run.
--  Todos podem ser rodados de novo sem apagar dados.
--
--  Este arquivo precisa vir primeiro: os outros usam a função
--  is_admin() criada aqui.
-- ─────────────────────────────────────────────────────────────

-- ── 1) Perfis ────────────────────────────────────────────────
-- Uma linha por conta de login. É criada sozinha quando você
-- convida um cliente pelo painel (Authentication > Users).
create table if not exists public.perfis (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  nome       text,
  papel      text not null default 'cliente' check (papel in ('cliente', 'admin')),
  criado_em  timestamptz not null default now()
);

-- E-mails que entram como admin. Para trocar a lista, edite aqui e
-- rode o script de novo.
create or replace function public.emails_admin()
returns text[] language sql immutable as $$
  select array['elisacmazzo@gmail.com', 'germanovitorhugo@gmail.com'];
$$;

create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome, papel)
  values (new.id, new.email,
          nullif(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name'), ''),
          case when lower(new.email) = any (public.emails_admin()) then 'admin' else 'cliente' end)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Contas que já existiam antes deste script também ganham perfil.
insert into public.perfis (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- "Sou admin?" — security definer para poder ser usada dentro das
-- próprias regras da tabela perfis sem entrar em recursão.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin');
$$;

-- Ninguém além do admin muda o papel ou o e-mail de um perfil.
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.papel := old.papel;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists proteger_perfil on public.perfis;
create trigger proteger_perfil
  before update on public.perfis
  for each row execute function public.proteger_perfil();

alter table public.perfis enable row level security;

drop policy if exists "perfil: dono ou admin lê" on public.perfis;
create policy "perfil: dono ou admin lê" on public.perfis
  for select to authenticated using (id = auth.uid() or public.is_admin());

drop policy if exists "perfil: dono ou admin edita" on public.perfis;
create policy "perfil: dono ou admin edita" on public.perfis
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());


-- O nome editado no painel do admin (perfis.nome) também aparece como
-- "Display name" na lista de usuários do Supabase.
create or replace function public.sincronizar_display_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
                              || jsonb_build_object('display_name', coalesce(new.nome, ''))
   where id = new.id;
  return new;
end $$;

drop trigger if exists sincronizar_display_name on public.perfis;
create trigger sincronizar_display_name
  after update of nome on public.perfis
  for each row when (new.nome is distinct from old.nome)
  execute function public.sincronizar_display_name();
