// ─────────────────────────────────────────────────────────────
//  vhg.js — código compartilhado entre as páginas do site
//  · cliente do Supabase (window.VHG.sb)
//  · cabeçalho e rodapé (injetados em #vhg-header / #vhg-footer)
//  · ajudantes de login e de perfil
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";

  var C = window.VHG_CONFIG || {};

  function configurado() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(C.SUPABASE_URL || "").trim()) &&
      String(C.SUPABASE_ANON_KEY || "").trim().length > 40;
  }

  var _sb = null;
  function sb() {
    if (_sb) return _sb;
    if (!configurado() || !window.supabase || !window.supabase.createClient) return null;
    _sb = window.supabase.createClient(C.SUPABASE_URL.trim(), C.SUPABASE_ANON_KEY.trim());
    return _sb;
  }

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function waLink(mensagem) {
    return "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(mensagem || C.WHATSAPP_MENSAGEM);
  }

  var ICONE_WHATSAPP = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2c.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"></path></svg>';

  var ICONE_INSTAGRAM = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4.2"></circle><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"></circle></svg>';

  /* ── Cabeçalho ──────────────────────────────────────────── */
  var LINKS = [
    ["QUEM SOU", "index.html#quem-sou"],
    ["O QUE FAÇO", "index.html#o-que-faco"],
    ["SERVIÇOS", "index.html#servicos"],
    ["FALE COMIGO", "index.html#fale-comigo"]
  ];

  function montarCabecalho() {
    var alvo = document.getElementById("vhg-header");
    if (!alvo) return;
    var desk = LINKS.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + "</a>"; }).join("");
    var mob = LINKS.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + "</a>"; }).join("");
    alvo.outerHTML =
      '<header class="site-header" id="site-header">' +
        '<div class="barra">' +
          '<a href="index.html" class="marca" aria-label="VHG Planejamento Financeiro, página inicial">' +
            '<span class="marca-vhg">VHG</span><span class="marca-sub">PLANEJAMENTO FINANCEIRO</span></a>' +
          '<nav class="nav-desktop" aria-label="Principal">' + desk +
            '<a href="area.html" class="nav-cliente">ÁREA DO CLIENTE</a>' +
            '<a href="' + waLink() + '" target="_blank" rel="noopener" class="nav-diag">AGENDAR CONVERSA</a></nav>' +
          '<button type="button" class="menu-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-mobile"><span></span><span></span><span></span></button>' +
        '</div>' +
        '<nav class="nav-mobile" id="nav-mobile" aria-label="Menu">' + mob +
          '<a href="area.html">ÁREA DO CLIENTE</a>' +
          '<a href="' + waLink() + '" target="_blank" rel="noopener" class="nav-diag">AGENDAR UMA CONVERSA</a></nav>' +
      '</header>';

    var header = document.getElementById("site-header");
    var botao = header.querySelector(".menu-btn");
    function fechar() { header.classList.remove("aberto"); botao.setAttribute("aria-expanded", "false"); botao.setAttribute("aria-label", "Abrir menu"); }
    botao.addEventListener("click", function () {
      var abrir = !header.classList.contains("aberto");
      header.classList.toggle("aberto", abrir);
      botao.setAttribute("aria-expanded", String(abrir));
      botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
    });
    header.querySelectorAll(".nav-mobile a").forEach(function (a) { a.addEventListener("click", fechar); });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1000) fechar(); });

    // Âncoras da própria página: rolagem suave descontando a altura do cabeçalho.
    var estaNaHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    header.querySelectorAll('a[href^="index.html#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (!estaNaHome) return;
        var el = document.getElementById(a.getAttribute("href").split("#")[1]);
        if (!el) return;
        e.preventDefault();
        fechar();
        rolarAte(el);
        history.replaceState(null, "", "#" + el.id);
      });
    });
  }

  function rolarAte(el) {
    var h = document.getElementById("site-header");
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (h ? h.offsetHeight : 0), behavior: "smooth" });
  }

  /* ── Rodapé ─────────────────────────────────────────────── */
  function montarRodape() {
    var alvo = document.getElementById("vhg-footer");
    if (!alvo) return;
    alvo.outerHTML =
      '<footer class="site-footer"><div class="colunas">' +
        '<div><div class="logo">VHG</div><div class="fio"></div><div class="sub">PLANEJAMENTO FINANCEIRO</div></div>' +
        '<div class="lista"><div>Vitor Hugo Germano</div><div><a href="mailto:' + esc(C.EMAIL) + '">' + esc(C.EMAIL) + '</a></div>' +
          '<div><a href="' + waLink() + '" target="_blank" rel="noopener">' + esc(C.WHATSAPP_EXIBICAO) + '</a></div><div>Botucatu, SP · atendimento online</div></div>' +
        '<div class="lista"><div><a href="index.html#servicos">Serviços</a></div>' +
          '<div><a href="area.html">Área do cliente</a></div>' +
          '<div><a href="https://instagram.com/' + esc(C.INSTAGRAM) + '" target="_blank" rel="noopener">@' + esc(C.INSTAGRAM) + '</a></div></div>' +
        '<div class="aviso">Este site tem caráter informativo e não constitui recomendação de investimento. Nenhum conteúdo aqui garante rentabilidade. <a href="politica-privacidade.html" style="border-bottom:1px solid rgba(242,237,228,.35)">Política de Privacidade</a>.</div>' +
      '</div></footer>';
  }

  /* ── Aviso de configuração pendente ─────────────────────── */
  function avisarSeNaoConfigurado() {
    if (configurado()) return;
    if (!document.querySelector("[data-precisa-supabase]")) return;
    var div = document.createElement("div");
    div.className = "aviso-config";
    div.innerHTML = "<b>Supabase ainda não configurado.</b> Preencha <code>assets/js/config.js</code> com a URL e a chave anon do projeto (veja o README). Até lá, login e envio de formulários não funcionam.";
    document.body.insertBefore(div, document.body.firstChild);
  }

  /* ── Login e perfil ─────────────────────────────────────── */
  async function sessao() {
    var c = sb();
    if (!c) return null;
    var r = await c.auth.getSession();
    return r.data && r.data.session ? r.data.session : null;
  }

  async function perfil(userId) {
    var c = sb();
    if (!c) return null;
    var r = await c.from("perfis").select("id, nome, email, papel").eq("id", userId).maybeSingle();
    return r.data || null;
  }

  // Exige login: sem sessão, manda para entrar.html e volta depois.
  async function exigirLogin() {
    var s = await sessao();
    if (!s) {
      location.replace("entrar.html?volta=" + encodeURIComponent(location.pathname.split("/").pop() + location.search));
      return null;
    }
    return s;
  }

  function primeiroNome(p, user) {
    var nome = (p && p.nome) || (user && user.user_metadata && (user.user_metadata.display_name || user.user_metadata.nome || user.user_metadata.full_name)) || "";
    if (!nome && user && user.email) nome = user.email.split("@")[0];
    nome = String(nome).trim().split(/\s+/)[0] || "";
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  function dataBR(iso, comHora) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    var opts = { day: "2-digit", month: "2-digit", year: "numeric" };
    if (comHora) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
    return d.toLocaleString("pt-BR", opts);
  }

  /* ── Datas no formato dd/mm/aaaa ─────────────────────────
     O seletor nativo (type="date") segue o idioma do navegador e
     aparece como mm/dd/yyyy em navegadores em inglês. Os campos de
     data são texto com máscara; por dentro a data fica em ISO
     (aaaa-mm-dd), que é o que os cálculos e o banco usam. */
  function mascaraData(v) {
    var d = String(v).replace(/\D/g, "").slice(0, 8);
    if (d.length > 4) return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
    if (d.length > 2) return d.slice(0, 2) + "/" + d.slice(2);
    return d;
  }
  // "dd/mm/aaaa" → "aaaa-mm-dd"; "" se incompleta, inexistente ou no futuro.
  function dataISO(br) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(br || ""));
    if (!m) return "";
    var dia = +m[1], mes = +m[2], ano = +m[3];
    var dt = new Date(Date.UTC(ano, mes - 1, dia));
    if (ano < 1900 || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== dia) return "";
    if (dt.getTime() > Date.now()) return "";
    return m[3] + "-" + m[2] + "-" + m[1];
  }
  // "aaaa-mm-dd" → "dd/mm/aaaa" (aceita vazio).
  function dataBRdeISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  // Atributos do campo de data, para colar dentro de um <input>.
  function attrsData() { return 'type="text" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off" data-data'; }

  window.VHG = {
    mascaraData: mascaraData, dataISO: dataISO, dataBRdeISO: dataBRdeISO, attrsData: attrsData,
    config: C, configurado: configurado, sb: sb, esc: esc, waLink: waLink, ICONE_WHATSAPP: ICONE_WHATSAPP, ICONE_INSTAGRAM: ICONE_INSTAGRAM,
    sessao: sessao, perfil: perfil, exigirLogin: exigirLogin, primeiroNome: primeiroNome, dataBR: dataBR, rolarAte: rolarAte
  };

  // Link de convite/nova senha que caiu em outra página (ex.: Site URL
  // apontando para a raiz): leva para entrar.html mantendo o token.
  if (/type=(invite|recovery)/.test(location.hash) && !/entrar\.html$/.test(location.pathname)) {
    location.replace("entrar.html" + location.hash);
    return;
  }

  function iniciar() {
    montarCabecalho();
    montarRodape();
    avisarSeNaoConfigurado();
    document.querySelectorAll("[data-wa]").forEach(function (a) { a.href = waLink(a.getAttribute("data-wa")); });
    document.querySelectorAll("[data-instagram]").forEach(function (a) { a.href = "https://instagram.com/" + C.INSTAGRAM; });
    document.querySelectorAll("[data-email]").forEach(function (a) { a.href = "mailto:" + C.EMAIL; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
