-- ─────────────────────────────────────────────────────────────
--  schema.sql — VHG Planejamento Financeiro
--
--  Como usar: painel do Supabase > SQL Editor > New query >
--  cole este arquivo inteiro > Run.
--
--  Pode rodar quantas vezes quiser: não duplica nada e não apaga
--  dados já gravados.
--
--  O que fica guardado aqui são só DADOS: respostas do diagnóstico
--  e pedidos de conversa. O relatório não é armazenado — ele é
--  montado na hora, a partir das respostas, sempre com o design
--  atual do site.
--
--  Segurança (RLS):
--    · cliente  → lê e edita só o próprio diagnóstico, e só enquanto
--                 ele não foi enviado; não consegue liberar o
--                 próprio relatório nem virar admin;
--    · admin    → lê tudo, libera relatórios, reabre diagnósticos;
--    · visitante (sem login) → só consegue ENVIAR pedido de conversa.
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

create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome)
  values (new.id, new.email, nullif(coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name'), ''))
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


-- ── 2) Diagnósticos ──────────────────────────────────────────
-- Um diagnóstico por cliente. `respostas` guarda o formulário
-- inteiro (JSON); `etapa` e `progresso` permitem pausar e voltar.
create table if not exists public.diagnosticos (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users (id) on delete cascade,
  status              text not null default 'andamento' check (status in ('andamento', 'enviado')),
  etapa               integer not null default 0,
  progresso           integer not null default 0 check (progresso between 0 and 100),
  respostas           jsonb not null default '{}'::jsonb,
  relatorio_liberado  boolean not null default false,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  enviado_em          timestamptz
);

create or replace function public.antes_de_salvar_diagnostico()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.atualizado_em := now();
  if not public.is_admin() then
    -- Cliente não libera o próprio relatório nem troca o dono.
    if tg_op = 'INSERT' then
      new.relatorio_liberado := false;
    else
      new.relatorio_liberado := old.relatorio_liberado;
      new.user_id := old.user_id;
    end if;
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

drop trigger if exists antes_de_salvar_diagnostico on public.diagnosticos;
create trigger antes_de_salvar_diagnostico
  before insert or update on public.diagnosticos
  for each row execute function public.antes_de_salvar_diagnostico();

alter table public.diagnosticos enable row level security;

drop policy if exists "diagnóstico: dono ou admin lê" on public.diagnosticos;
create policy "diagnóstico: dono ou admin lê" on public.diagnosticos
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "diagnóstico: dono cria" on public.diagnosticos;
create policy "diagnóstico: dono cria" on public.diagnosticos
  for insert to authenticated with check (user_id = auth.uid() or public.is_admin());

-- O cliente só edita enquanto está em andamento; depois de enviado,
-- só o admin reabre.
drop policy if exists "diagnóstico: dono edita em andamento" on public.diagnosticos;
create policy "diagnóstico: dono edita em andamento" on public.diagnosticos
  for update to authenticated
  using ((user_id = auth.uid() and status = 'andamento') or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "diagnóstico: admin apaga" on public.diagnosticos;
create policy "diagnóstico: admin apaga" on public.diagnosticos
  for delete to authenticated using (public.is_admin());


-- ── 3) Pedidos de conversa (formulário público) ──────────────
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  criado_em     timestamptz not null default now(),
  nome          text not null,
  email         text not null,
  whatsapp      text,
  cidade        text,
  momento       text,
  prioridades   text[] not null default '{}',
  mensagem      text,
  consentimento boolean not null default false,
  status        text not null default 'novo' check (status in ('novo', 'contatado', 'cliente', 'arquivado'))
);

create index if not exists leads_criado_em_idx on public.leads (criado_em desc);

alter table public.leads enable row level security;

-- Qualquer visitante envia (com consentimento), mas não lê nada.
drop policy if exists "lead: qualquer um envia" on public.leads;
create policy "lead: qualquer um envia" on public.leads
  for insert to anon, authenticated
  with check (consentimento = true and status = 'novo');

drop policy if exists "lead: admin lê" on public.leads;
create policy "lead: admin lê" on public.leads
  for select to authenticated using (public.is_admin());

drop policy if exists "lead: admin edita" on public.leads;
create policy "lead: admin edita" on public.leads
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lead: admin apaga" on public.leads;
create policy "lead: admin apaga" on public.leads
  for delete to authenticated using (public.is_admin());


-- ── 4) Conferência ───────────────────────────────────────────
-- Deve listar as três tabelas.
select table_name from information_schema.tables
 where table_schema = 'public' and table_name in ('perfis', 'diagnosticos', 'leads')
 order by table_name;


-- ── 5) Tornar o Vitor admin (rode DEPOIS de criar a conta dele) ──
-- update public.perfis set papel = 'admin' where email = 'germanovitorhugo@gmail.com';
