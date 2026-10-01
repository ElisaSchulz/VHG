-- ─────────────────────────────────────────────────────────────
--  2-diagnosticos.sql — tabela do diagnóstico financeiro
--  VHG Planejamento Financeiro · Supabase
--
--  Rode os arquivos na ordem (1, 2, 3, 4, 5), um por vez:
--  SQL Editor > New query > cole o arquivo inteiro > Run.
--  Todos podem ser rodados de novo sem apagar dados.
-- ─────────────────────────────────────────────────────────────

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
