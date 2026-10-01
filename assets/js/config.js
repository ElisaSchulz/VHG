// ─────────────────────────────────────────────────────────────
//  config.js — chaves do projeto Supabase
//
//  Painel do Supabase > Project Settings > API:
//    · Project URL      → SUPABASE_URL
//    · Publishable key (ou a antiga "anon public") → SUPABASE_ANON_KEY
//
//  Essa chave é pública por definição: quem protege os dados
//  são as regras (RLS) criadas pelo arquivo supabase/schema.sql.
//  Nunca coloque aqui a "secret key" nem a antiga "service_role".
// ─────────────────────────────────────────────────────────────
window.VHG_CONFIG = {
  SUPABASE_URL: "https://ibowjbojkymccflpjipp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_igXSPJj7LWvEkm5KSa3pBw_oXXg1TBL",

  // Contato usado em todo o site
  EMAIL: "germanovitorhugo@gmail.com",
  WHATSAPP: "5514996433289",
  WHATSAPP_EXIBICAO: "+55 14 99643-3289",
  WHATSAPP_MENSAGEM: "Olá, Vitor! Vim pelo site e gostaria de conversar sobre planejamento financeiro.",
  INSTAGRAM: "vitorhgermano"
};
