-- ─────────────────────────────────────────────────────────────
--  3-leads.sql — pedidos de conversa (formulário público)
--  VHG Planejamento Financeiro · Supabase
--
--  Rode os arquivos na ordem (1, 2, 3, 4, 5), um por vez:
--  SQL Editor > New query > cole o arquivo inteiro > Run.
--  Todos podem ser rodados de novo sem apagar dados.
-- ─────────────────────────────────────────────────────────────

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
