-- ─────────────────────────────────────────────────────────────
--  5-admins-e-conferencia.sql — admins e conferência final
--  VHG Planejamento Financeiro · Supabase
--
--  Rode os arquivos na ordem (1, 2, 3, 4, 5), um por vez:
--  SQL Editor > New query > cole o arquivo inteiro > Run.
--  Todos podem ser rodados de novo sem apagar dados.
-- ─────────────────────────────────────────────────────────────

-- ── 5) Admins ────────────────────────────────────────────────
-- Contas que já existem com esses e-mails viram admin agora; as
-- que forem criadas depois já nascem admin (veja criar_perfil).
update public.perfis set papel = 'admin'
 where lower(email) = any (public.emails_admin()) and papel <> 'admin';


-- ── 6) Conferência ───────────────────────────────────────────
-- Deve listar as quatro tabelas.
select table_name from information_schema.tables
 where table_schema = 'public' and table_name in ('perfis', 'diagnosticos', 'fichas', 'leads')
 order by table_name;
