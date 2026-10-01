-- ─────────────────────────────────────────────────────────────
--  6-contratos.sql — contrato assinado eletronicamente
--  VHG Planejamento Financeiro · Supabase
--
--  Rode depois dos arquivos 1 a 5 (SQL Editor > New query > cole o
--  arquivo inteiro > Run). Pode ser rodado de novo sem apagar dados.
--
--  O texto do contrato é gravado exatamente como o cliente leu. Data,
--  hora, IP e código de verificação (SHA-256 do texto) são preenchidos
--  pelo próprio banco, não pelo navegador, para não poderem ser
--  forjados. Depois de assinado, o cliente não altera nem apaga.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.contratos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references auth.users (id) on delete cascade,
  plano            text not null,
  forma_pagamento  text,
  versao           text not null,
  texto            text not null,
  assinado_nome    text not null,
  assinado_em      timestamptz not null default now(),
  ip               text,
  user_agent       text,
  hash_sha256      text not null default ''
);

create or replace function public.antes_de_assinar_contrato()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cabecalhos json := nullif(current_setting('request.headers', true), '')::json;
begin
  new.assinado_em := now();
  new.hash_sha256 := encode(sha256(convert_to(new.texto, 'UTF8')), 'hex');
  new.ip := coalesce(
    cabecalhos ->> 'cf-connecting-ip',
    split_part(coalesce(cabecalhos ->> 'x-forwarded-for', ''), ',', 1),
    cabecalhos ->> 'x-real-ip');
  if new.ip = '' then new.ip := null; end if;
  return new;
end $$;

drop trigger if exists antes_de_assinar_contrato on public.contratos;
create trigger antes_de_assinar_contrato
  before insert on public.contratos
  for each row execute function public.antes_de_assinar_contrato();

alter table public.contratos enable row level security;

drop policy if exists "contrato: dono ou admin lê" on public.contratos;
create policy "contrato: dono ou admin lê" on public.contratos
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- O cliente só assina o próprio contrato, e só depois de enviar a ficha.
drop policy if exists "contrato: dono assina" on public.contratos;
create policy "contrato: dono assina" on public.contratos
  for insert to authenticated
  with check (user_id = auth.uid()
    and exists (select 1 from public.fichas f where f.user_id = auth.uid() and f.status = 'enviado'));

-- Sem regra de UPDATE: ninguém altera um contrato assinado. O admin
-- pode cancelar (apagar), e o cliente então assina de novo.
drop policy if exists "contrato: admin cancela" on public.contratos;
create policy "contrato: admin cancela" on public.contratos
  for delete to authenticated using (public.is_admin());

-- O cliente pode reabrir a própria ficha para corrigir ou completar,
-- desde que ainda não tenha assinado o contrato (o contrato é feito com
-- os dados da ficha). Depois de assinado, só o admin reabre.
create or replace function public.reabrir_minha_ficha()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'É preciso estar logado.';
  end if;
  if exists (select 1 from public.contratos where user_id = auth.uid()) then
    raise exception 'O contrato já foi assinado. Para alterar a ficha, fale com o Vitor.';
  end if;
  update public.fichas set status = 'andamento'
   where user_id = auth.uid() and status = 'enviado';
end $$;

revoke all on function public.reabrir_minha_ficha() from public, anon;
grant execute on function public.reabrir_minha_ficha() to authenticated;

-- Conferência: deve mostrar a tabela contratos.
select table_name from information_schema.tables
 where table_schema = 'public' and table_name = 'contratos';
