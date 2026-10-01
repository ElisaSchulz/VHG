-- ─────────────────────────────────────────────────────────────
--  4-fichas.sql — ficha cadastral
--  VHG Planejamento Financeiro · Supabase
--
--  Rode os arquivos na ordem (1, 2, 3, 4, 5), um por vez:
--  SQL Editor > New query > cole o arquivo inteiro > Run.
--  Todos podem ser rodados de novo sem apagar dados.
-- ─────────────────────────────────────────────────────────────

-- ── 4) Ficha cadastral ───────────────────────────────────────
-- Primeiro formulário do cliente (dados pessoais, família, profissão
-- e contatos). Mesmas regras do diagnóstico: o cliente edita até
-- enviar; depois só o admin reabre.
create table if not exists public.fichas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null unique references auth.users (id) on delete cascade,
  status         text not null default 'andamento' check (status in ('andamento', 'enviado')),
  progresso      integer not null default 0 check (progresso between 0 and 100),
  respostas      jsonb not null default '{}'::jsonb,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  enviado_em     timestamptz
);

create or replace function public.antes_de_salvar_ficha()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.atualizado_em := now();
  if tg_op = 'UPDATE' and not public.is_admin() then
    new.user_id := old.user_id;
  end if;
  if new.status = 'enviado' and (tg_op = 'INSERT' or old.status is distinct from 'enviado') then
    new.enviado_em := now();
    new.progresso := 100;
  end if;
  if new.status = 'andamento' then
    new.enviado_em := null;
  end if;
  return new;
end $$;

drop trigger if exists antes_de_salvar_ficha on public.fichas;
create trigger antes_de_salvar_ficha
  before insert or update on public.fichas
  for each row execute function public.antes_de_salvar_ficha();

alter table public.fichas enable row level security;

drop policy if exists "ficha: dono ou admin lê" on public.fichas;
create policy "ficha: dono ou admin lê" on public.fichas
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ficha: dono cria" on public.fichas;
create policy "ficha: dono cria" on public.fichas
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "ficha: dono edita em andamento" on public.fichas;
create policy "ficha: dono edita em andamento" on public.fichas
  for update to authenticated
  using ((user_id = auth.uid() and status = 'andamento') or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "ficha: admin apaga" on public.fichas;
create policy "ficha: admin apaga" on public.fichas
  for delete to authenticated using (public.is_admin());
