// ─────────────────────────────────────────────────────────────
//  formato.js | VHG Planejamento Financeiro
//  Formatação usada pelas páginas (moeda, datas, idade, escape de
//  HTML) e os nomes dos níveis do relatório. As regras de cálculo do
//  diagnóstico NÃO ficam aqui: o relatório é calculado no servidor,
//  pela função "relatorio" do Supabase, e chega pronto ao navegador.
//  Expõe tudo em window.VHGDiag.
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";

  var NIVEL_TEXTS = {
    1: { nome: "Ponto de Partida", contexto: "Você está no início da jornada de organização financeira. Os fundamentos ainda precisam ser construídos, um passo de cada vez." },
    2: { nome: "Em Construção", contexto: "Algumas bases já existem, mas ainda há lacunas importantes que pedem atenção antes de avançar para otimização." },
    3: { nome: "Fundação Formada", contexto: "Os fundamentos estão no lugar. Agora é hora de fechar as lacunas que restam e dar direção de longo prazo ao que já foi construído." },
    4: { nome: "Consolidado", contexto: "Sua vida financeira está bem estruturada na maior parte das dimensões. O foco agora é refinar pontos específicos e manter consistência." },
    5: { nome: "Otimizado", contexto: "Você construiu uma relação madura e estruturada com o dinheiro. A partir daqui, o jogo é sofisticação e eficiência, não mais construção de base." }
  };

  /* ===================== Helpers ===================== */
  function fmt(value) {
    var n = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
  }
  function pct(value, digits) {
    var d = digits === undefined ? 0 : digits;
    return (Number(value) || 0).toFixed(d).replace(".", ",") + "%";
  }
  function num1(value) {
    return (Number(value) || 0).toFixed(1).replace(".", ",");
  }
  // Versão curta para eixos de gráfico: "R$ 1,2 mi", "R$ 850 mil".
  function fmtCurto(value) {
    var n = Number(value) || 0;
    var abs = Math.abs(n);
    if (abs >= 1e6) return "R$ " + (n / 1e6).toFixed(abs >= 1e7 ? 0 : 1).replace(".", ",") + " mi";
    if (abs >= 1e3) return "R$ " + Math.round(n / 1e3) + " mil";
    return "R$ " + Math.round(n);
  }
  function plural(n, singular, pluralForma) {
    return n + " " + (Math.abs(n) === 1 ? singular : pluralForma);
  }
  // Idade a partir da data de nascimento (AAAA-MM-DD), na data de referência.
  // Retorna null se a data for inválida ou implausível.
  function idadeEm(dataNascimento, referencia) {
    if (!dataNascimento) return null;
    var n = new Date(dataNascimento);
    if (isNaN(n.getTime())) return null;
    var hoje = referencia ? new Date(referencia) : new Date();
    if (isNaN(hoje.getTime())) hoje = new Date();
    var anos = hoje.getFullYear() - n.getFullYear();
    var m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) anos--;
    return (anos >= 0 && anos <= 120) ? anos : null;
  }
  // Idade efetiva: calcula pela data de nascimento quando existir e,
  // para os diagnósticos antigos, cai de volta no campo `idade`.
  function idadeDe(D, referencia) {
    var calc = idadeEm(D.dataNascimento, referencia);
    return calc !== null ? calc : (Number(D.idade) || null);
  }
  function formatarData(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  window.VHGDiag = {
    fmt: fmt,
    fmtCurto: fmtCurto,
    pct: pct,
    num1: num1,
    plural: plural,
    idadeEm: idadeEm,
    idadeDe: idadeDe,
    formatarData: formatarData,
    esc: esc,
    NIVEL_TEXTS: NIVEL_TEXTS
  };
})();
