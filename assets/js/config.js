// ─────────────────────────────────────────────────────────────
//  config.js — chaves do projeto Supabase
//
//  Painel do Supabase > Project Settings > API:
//    · Project URL      → SUPABASE_URL
//    · anon / public    → SUPABASE_ANON_KEY
//
//  A chave "anon" é pública por definição: quem protege os dados
//  são as regras (RLS) criadas pelo arquivo supabase/schema.sql.
//  Nunca coloque aqui a chave "service_role".
// ─────────────────────────────────────────────────────────────
window.VHG_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Contato usado em todo o site
  EMAIL: "germanovitorhugo@gmail.com",
  WHATSAPP: "5514996433289",
  WHATSAPP_EXIBICAO: "+55 14 99643-3289",
  WHATSAPP_MENSAGEM: "Olá, Vitor! Vim pelo site e gostaria de conversar sobre planejamento financeiro.",
  INSTAGRAM: "vitorhgermano"
};
