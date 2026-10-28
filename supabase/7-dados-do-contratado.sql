-- ─────────────────────────────────────────────────────────────
--  7-dados-do-contratado.sql — dados do Vitor que entram no contrato
--  VHG Planejamento Financeiro · Supabase
--
--  Rode depois dos arquivos 1 a 6 (SQL Editor > New query > cole o
--  arquivo inteiro > Run). Pode ser rodado de novo sem apagar dados.
--
--  Guarda estado civil, RG e CPF do titular, preenchidos pelo admin
--  no painel. O cliente logado pode ler (esses dados aparecem no
--  contrato que ele assina), mas só o admin altera.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.configuracoes (
  chave          text primary key,
  valor          jsonb not null default '{}'::jsonb,
  atualizado_em  timestamptz not null default now()
);

insert into public.configuracoes (chave) values ('contratado')
  on conflict (chave) do nothing;

alter table public.configuracoes enable row level security;

drop policy if exists "configuracoes: logado lê" on public.configuracoes;
create policy "configuracoes: logado lê" on public.configuracoes
  for select to authenticated using (true);

drop policy if exists "configuracoes: admin altera" on public.configuracoes;
create policy "configuracoes: admin altera" on public.configuracoes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Conferência: deve mostrar a linha 'contratado'.
select chave, valor from public.configuracoes;
