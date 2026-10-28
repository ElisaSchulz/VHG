/* ─────────────────────────────────────────────────────────────
   estudio-instagram.js — aba INSTAGRAM do painel do admin

   Recursos de identidade visual e modelos editáveis para o
   Instagram (destaques, carrossel, posts, stories, capas de reels,
   stickers e recursos de edição de reels). Tudo é desenhado em
   <canvas> com as cores e fontes do manual de marca e exportado em
   PNG no tamanho final. Os modelos salvos ficam neste navegador.
   ───────────────────────────────────────────────────────────── */
window.VHG_ESTUDIO = (function () {
  "use strict";

  var C = window.VHG_CONFIG || {};
  var IG = "@" + (C.INSTAGRAM || "vitorhgermano");
  var SITE = "vitorhugogermano.com.br";
  var RETRATO = "assets/marca/instagram/retrato-vitor.jpg";
  var MARCA = "assets/marca/";
  var CHAVE_SALVOS = "vhg-estudio-salvos";

  var COR = {
    petroleo: "#123B47", noite: "#0B2530", cobre: "#C08A4E", nevoa: "#DCE3E2", papel: "#F2EDE4",
    superficie: "#FBF9F5", tinta: "#48534F", pedra: "#8A8175", linha: "#DCD4C6", branco: "#FFFFFF"
  };

  var TEMAS = {
    petroleo: { nome: "Petróleo", fundo: COR.petroleo, titulo: COR.papel, texto: "rgba(242,237,228,.86)", suave: "rgba(242,237,228,.6)", rotulo: COR.cobre, fio: COR.cobre, linha: "rgba(242,237,228,.22)", btnFundo: COR.cobre, btnTexto: COR.noite, padrao: "rgba(242,237,228,.06)", escuro: true },
    noite: { nome: "Noite", fundo: COR.noite, titulo: COR.papel, texto: "rgba(242,237,228,.86)", suave: "rgba(242,237,228,.6)", rotulo: COR.cobre, fio: COR.cobre, linha: "rgba(242,237,228,.2)", btnFundo: COR.cobre, btnTexto: COR.noite, padrao: "rgba(242,237,228,.09)", escuro: true },
    papel: { nome: "Papel", fundo: COR.papel, titulo: COR.petroleo, texto: COR.tinta, suave: COR.pedra, rotulo: COR.pedra, fio: COR.cobre, linha: "#D9D0BF", btnFundo: COR.petroleo, btnTexto: COR.papel, padrao: "rgba(18,59,71,.12)", escuro: false },
    nevoa: { nome: "Névoa", fundo: COR.nevoa, titulo: COR.noite, texto: COR.tinta, suave: "#5E6B6A", rotulo: COR.petroleo, fio: COR.cobre, linha: "rgba(18,59,71,.18)", btnFundo: COR.petroleo, btnTexto: COR.papel, padrao: "rgba(18,59,71,.1)", escuro: false },
    cobre: { nome: "Cobre", fundo: COR.cobre, titulo: COR.noite, texto: COR.noite, suave: "rgba(11,37,48,.7)", rotulo: COR.noite, fio: COR.noite, linha: "rgba(11,37,48,.25)", btnFundo: COR.noite, btnTexto: COR.papel, padrao: "rgba(11,37,48,.08)", escuro: false }
  };
  var T_FEED = ["petroleo", "papel", "noite", "nevoa"];

  var FORMATOS = { "4:5": [1080, 1350], "1:1": [1080, 1080], "9:16": [1080, 1920] };
  var OP_FEED = [["4:5", "Retrato 4:5 · 1080 × 1350"], ["1:1", "Quadrado 1:1 · 1080 × 1080"]];

  function ext(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function dois(n) { return n < 10 ? "0" + n : String(n); }
  function slug(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pesoT(t) { return t.escuro ? 200 : 300; }

  /* ── Imagens (retrato padrão e fotos enviadas) ──────────── */
  var IMG = {}, aoCarregarImagem = null;
  function imagem(src) {
    if (!src) return null;
    var i = IMG[src];
    if (!i) {
      i = IMG[src] = new Image();
      i.onload = function () { if (aoCarregarImagem) aoCarregarImagem(); };
      i.src = src;
    }
    return i.complete && i.naturalWidth ? i : null;
  }
  function esperarImagem(src) {
    return new Promise(function (ok) {
      var i = IMG[src] || (IMG[src] = new Image());
      if (i.complete && i.naturalWidth) return ok();
      i.addEventListener("load", function () { ok(); });
      i.addEventListener("error", function () { ok(); });
      if (!i.src) i.src = src;
    });
  }

  /* ── Texto ───────────────────────────────────────────────── */
  function fonte(ctx, peso, tam, fam, it) {
    ctx.font = (it ? "italic " : "") + peso + " " + tam.toFixed(1) + "px " + (fam === "sans" ? "Archivo, Helvetica, sans-serif" : "Newsreader, Georgia, serif");
  }
  /* As setas não existem no Archivo: são desenhadas com traço. */
  var SETAS = { "→": 1, "↓": 1, "←": 1, "↑": 1 };
  function tamFonte(ctx) { return parseFloat((ctx.font.match(/([\d.]+)px/) || [0, 20])[1]); }
  function larguraChar(ctx, c) { return SETAS[c] ? tamFonte(ctx) * (c === "↓" || c === "↑" ? .6 : 1.1) : ctx.measureText(c).width; }
  function seta(ctx, c, x, y) {
    var t = tamFonte(ctx), w = larguraChar(ctx, c), cy = y + t * .5, cx = x + w / 2, p = t * .28;
    ctx.save(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1.5, t * .08); ctx.lineCap = "square"; ctx.beginPath();
    if (c === "→") { ctx.moveTo(x, cy); ctx.lineTo(x + w, cy); ctx.moveTo(x + w - p, cy - p); ctx.lineTo(x + w, cy); ctx.lineTo(x + w - p, cy + p); }
    else if (c === "←") { ctx.moveTo(x + w, cy); ctx.lineTo(x, cy); ctx.moveTo(x + p, cy - p); ctx.lineTo(x, cy); ctx.lineTo(x + p, cy + p); }
    else if (c === "↓") { ctx.moveTo(cx, y); ctx.lineTo(cx, y + t * .9); ctx.moveTo(cx - p, y + t * .9 - p); ctx.lineTo(cx, y + t * .9); ctx.lineTo(cx + p, y + t * .9 - p); }
    else { ctx.moveTo(cx, y + t * .9); ctx.lineTo(cx, y); ctx.moveTo(cx - p, y + p); ctx.lineTo(cx, y); ctx.lineTo(cx + p, y + p); }
    ctx.stroke(); ctx.restore();
  }
  function larguraEsp(ctx, s, esp) {
    var w = 0, ch = String(s).split("");
    ch.forEach(function (c) { w += larguraChar(ctx, c) + esp; });
    return ch.length ? w - esp : 0;
  }
  function espacado(ctx, s, x, y, esp) {
    String(s).split("").forEach(function (c) { if (SETAS[c]) seta(ctx, c, x, y); else ctx.fillText(c, x, y); x += larguraChar(ctx, c) + esp; });
  }
  /* Rótulo em caixa alta com tracking largo. Devolve a largura. */
  function rotulo(ctx, s, x, y, o) {
    s = String(s || "").toUpperCase();
    fonte(ctx, o.peso || 500, o.tam, "sans");
    ctx.fillStyle = o.cor; ctx.textBaseline = "top"; ctx.textAlign = "left";
    var esp = (o.esp == null ? .22 : o.esp) * o.tam, w = larguraEsp(ctx, s, esp);
    espacado(ctx, s, o.alinhar === "dir" ? x - w : o.alinhar === "centro" ? x - w / 2 : x, y, esp);
    return w;
  }
  function monograma(ctx, x, y, tam, cor, peso, alinhar, s) {
    s = s || "VHG";
    fonte(ctx, peso || 200, tam, "serif");
    ctx.fillStyle = cor; ctx.textBaseline = "top"; ctx.textAlign = "left";
    var esp = tam * .06, w = larguraEsp(ctx, s, esp);
    espacado(ctx, s, alinhar === "centro" ? x - w / 2 : alinhar === "dir" ? x - w : x, y, esp);
    return w;
  }
  function quebrar(ctx, txt, larg) {
    var out = [];
    String(txt || "").split("\n").forEach(function (par) {
      var pal = par.split(/\s+/).filter(Boolean), l = "";
      if (!pal.length) { out.push(""); return; }
      pal.forEach(function (p) {
        var t = l ? l + " " + p : p;
        if (l && ctx.measureText(t).width > larg) { out.push(l); l = p; } else l = t;
      });
      out.push(l);
    });
    return out;
  }
  /* Bloco de texto com quebra de linha; y é o topo. Devolve a altura. */
  function bloco(ctx, txt, x, y, o) {
    fonte(ctx, o.peso || 400, o.tam, o.fam, o.it);
    var larg = o.larg || 9999, ls = quebrar(ctx, txt, larg);
    if (o.equilibrar && ls.length > 1) {
      for (var w = larg - 12; w > larg * .55; w -= 12) {
        var t = quebrar(ctx, txt, w);
        if (t.length > ls.length) break;
        ls = t;
      }
    }
    var lh = o.tam * (o.lh || 1.2);
    if (!o.medir) {
      ctx.fillStyle = o.cor; ctx.textBaseline = "top"; ctx.textAlign = "left";
      ls.forEach(function (l, i) {
        var lx = x;
        if (o.alinhar === "centro") lx = x + (larg - ctx.measureText(l).width) / 2;
        ctx.fillText(l, lx, y + i * lh + (lh - o.tam) / 2);
      });
    }
    return ls.length * lh;
  }

  /* ── Pilha de elementos (texto, fio, rótulo, botão) ──────── */
  function vazio(s) { return s == null || !String(s).trim(); }
  function T(txt, o) {
    if (vazio(txt)) return null;
    function w(larg) { return o.larg ? Math.min(o.larg, larg) : larg; }
    return {
      antes: o.antes || 0,
      medir: function (ctx, larg) { return bloco(ctx, txt, 0, 0, ext(o, { larg: w(larg), medir: true })); },
      desenhar: function (ctx, x, y, larg, al) {
        var ww = w(larg);
        bloco(ctx, txt, al === "centro" ? x + (larg - ww) / 2 : x, y, ext(o, { larg: ww, alinhar: al }));
      }
    };
  }
  function Fio(w, cor, antes) {
    return {
      antes: antes || 0,
      medir: function () { return 2; },
      desenhar: function (ctx, x, y, larg, al) { ctx.fillStyle = cor; ctx.fillRect(al === "centro" ? x + (larg - w) / 2 : x, y, w, 2); }
    };
  }
  function R(txt, o) {
    if (vazio(txt)) return null;
    return {
      antes: o.antes || 0,
      medir: function () { return o.tam * 1.25; },
      desenhar: function (ctx, x, y, larg, al) { rotulo(ctx, txt, al === "centro" ? x + larg / 2 : x, y, ext(o, { alinhar: al === "centro" ? "centro" : "esq" })); }
    };
  }
  function Botao(txt, t, o) {
    if (vazio(txt)) return null;
    o = o || {};
    var tam = o.tam || 22, pv = tam * 1.4, ph = tam * 2;
    return {
      antes: o.antes || 0,
      medir: function () { return tam + pv * 2; },
      desenhar: function (ctx, x, y, larg, al) {
        fonte(ctx, 500, tam, "sans");
        var w = larguraEsp(ctx, String(txt).toUpperCase(), tam * .2) + ph * 2;
        var bx = al === "centro" ? x + (larg - w) / 2 : x;
        ctx.fillStyle = o.fundo || t.btnFundo; ctx.fillRect(bx, y, w, tam + pv * 2);
        rotulo(ctx, txt, bx + ph, y + pv, { tam: tam, cor: o.texto || t.btnTexto, esp: .2 });
      }
    };
  }
  function ItemLista(n, txt, t, tam, antes) {
    if (vazio(txt)) return null;
    var recuo = tam * 3.4;
    return {
      antes: antes || 0,
      medir: function (ctx, larg) { return tam * 1.1 * 2 + Math.max(tam * 1.5, bloco(ctx, txt, 0, 0, { fam: "sans", tam: tam, lh: 1.5, larg: larg - recuo, medir: true })); },
      desenhar: function (ctx, x, y, larg) {
        ctx.fillStyle = t.linha; ctx.fillRect(x, y, larg, 2);
        var p = y + tam * 1.1;
        bloco(ctx, dois(n), x, p - tam * .12, { fam: "serif", peso: 300, tam: tam * 1.5, lh: 1, cor: COR.cobre });
        bloco(ctx, txt, x + recuo, p, { fam: "sans", tam: tam, lh: 1.5, larg: larg - recuo, cor: t.titulo });
      }
    };
  }
  function achatar(l) { return l.reduce(function (a, i) { return a.concat(Array.isArray(i) ? achatar(i) : i ? [i] : []); }, []); }
  function pilha(ctx, itens, x, larg, y0, y1, ancora, al, soMedir) {
    itens = achatar(itens);
    var hs = itens.map(function (i, k) { return (k ? i.antes : 0) + i.medir(ctx, larg); });
    var tot = hs.reduce(function (a, b) { return a + b; }, 0);
    var y = ancora === "topo" ? y0 : ancora === "base" ? y1 - tot : y0 + (y1 - y0 - tot) / 2, ini = y;
    if (!soMedir) itens.forEach(function (it, k) { it.desenhar(ctx, x, y + (k ? it.antes : 0), larg, al); y += hs[k]; });
    return { y: ini, h: tot };
  }
  /* Reduz o conjunto (fator k) até caber entre y0 e y1. */
  function pilhaAjustada(ctx, construir, x, larg, y0, y1, ancora, al, soMedir) {
    var k = 1, r;
    for (; k > .5; k -= .04) {
      r = pilha(ctx, construir(k), x, larg, y0, y1, ancora, al, true);
      if (r.h <= y1 - y0) break;
    }
    return pilha(ctx, construir(k), x, larg, y0, y1, ancora, al, soMedir);
  }

  /* ── Peças gráficas da marca ─────────────────────────────── */
  function fundo(ctx, W, H, cor) { ctx.fillStyle = cor; ctx.fillRect(0, 0, W, H); }
  function padrao(ctx, W, H, cor, densidade) {
    var tam = W / ({ larga: 7, media: 10, densa: 14 }[densidade] || 7);
    fonte(ctx, 200, tam, "serif");
    ctx.fillStyle = cor; ctx.textBaseline = "top"; ctx.textAlign = "left";
    var esp = tam * .22, w = larguraEsp(ctx, "VHG", esp), passo = w + tam * .9, lh = tam * 1.3;
    for (var r = 0, y = -tam * .3; y < H; r++, y += lh) {
      for (var x = (r % 2 ? -W * .09 : 0) - passo / 3; x < W; x += passo) espacado(ctx, "VHG", x, y, esp);
    }
  }
  /* Logo principal: VHG + régua + descritor, centralizado em cx. y = topo. */
  function logo(ctx, cx, y, tam, cores, descritor) {
    fonte(ctx, cores.peso || 200, tam, "serif");
    ctx.fillStyle = cores.vhg; ctx.textBaseline = "top"; ctx.textAlign = "left";
    var esp = tam * .08, w = larguraEsp(ctx, "VHG", esp);
    espacado(ctx, "VHG", cx - w / 2, y, esp);
    if (!descritor) return tam;
    var yr = y + tam * 1.06;
    ctx.fillStyle = cores.fio; ctx.fillRect(cx - w / 4, yr, w / 2, Math.max(2, tam * .012));
    rotulo(ctx, "PLANEJAMENTO FINANCEIRO", cx, yr + tam * .17, { tam: tam * .085, cor: cores.desc, esp: .36, alinhar: "centro" });
    return yr + tam * .17 + tam * .1 - y;
  }
  function coresLogo(t) { return t.escuro ? { vhg: COR.papel, fio: COR.cobre, desc: "rgba(242,237,228,.9)", peso: 200 } : { vhg: COR.petroleo, fio: COR.cobre, desc: "#6B6358", peso: 300 }; }
  function cabecalho(ctx, W, M, t, rot, pag) {
    if (!vazio(rot)) rotulo(ctx, rot, M, M, { tam: 20, cor: t.rotulo, esp: .26 });
    if (pag) rotulo(ctx, pag, W - M, M, { tam: 20, peso: 400, cor: t.suave, esp: .2, alinhar: "dir" });
  }
  /* Assinatura no pé do post. Devolve a altura ocupada. */
  function rodape(ctx, W, H, M, t, dir) {
    if (t.escuro) {
      monograma(ctx, M, H - M - 18 - 16 - 54, 54, COR.papel, 200);
      rotulo(ctx, IG, M, H - M - 18, { tam: 18, peso: 400, cor: t.suave, esp: .2 });
      if (dir) rotulo(ctx, dir, W - M, H - M - 20, { tam: 20, cor: t.texto, esp: .2, alinhar: "dir" });
      return 88;
    }
    var y = H - M - 46;
    ctx.fillStyle = t.linha; ctx.fillRect(M, y - 36, W - 2 * M, 2);
    monograma(ctx, M, y, 46, t.titulo, 300);
    rotulo(ctx, dir || IG, W - M, y + 16, { tam: 18, peso: dir ? 500 : 400, cor: dir ? t.titulo : t.suave, esp: .2, alinhar: "dir" });
    return 84;
  }
  function rodapeStory(ctx, W, y, t) {
    monograma(ctx, W / 2, y, 44, t.escuro ? COR.papel : t.titulo, pesoT(t), "centro");
    rotulo(ctx, IG, W / 2, y + 62, { tam: 18, peso: 400, cor: t.suave, esp: .2, alinhar: "centro" });
  }
  function aviso(ctx, W, H, M, t, txt) {
    if (vazio(txt)) return;
    bloco(ctx, txt, M, H - M / 2 - 10, { fam: "sans", tam: 17, lh: 1.2, cor: t.escuro ? "rgba(220,227,226,.75)" : COR.pedra, larg: W - 2 * M });
  }
  function foto(ctx, src, x, y, w, h, focoY) {
    ctx.fillStyle = COR.nevoa; ctx.fillRect(x, y, w, h);
    var img = imagem(src);
    if (!img) { rotulo(ctx, "SUA FOTO", x + w / 2, y + h / 2 - 12, { tam: 24, cor: COR.pedra, alinhar: "centro" }); return; }
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * s, ih = img.naturalHeight * s;
    var fy = focoY == null ? .3 : focoY / 100;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * fy, iw, ih);
    ctx.restore();
  }

  /* ── Guias (só na prévia, nunca no arquivo) ──────────────── */
  var COR_GUIA = "rgba(192,138,78,.95)";
  function tracejado(ctx, fn) {
    ctx.save(); ctx.strokeStyle = COR_GUIA; ctx.lineWidth = 3; ctx.setLineDash([14, 10]);
    ctx.beginPath(); fn(); ctx.stroke(); ctx.restore();
  }
  function zonaSticker(ctx, o, x, y, w, h, txt) {
    if (!o.guia) return;
    tracejado(ctx, function () { ctx.rect(x, y, w, h); });
    rotulo(ctx, txt, x + w / 2, y + h / 2 - 11, { tam: 20, cor: COR_GUIA, alinhar: "centro" });
  }
  function guiaStory(ctx, W, H, o) {
    if (!o.guia) return;
    ctx.save(); ctx.fillStyle = "rgba(192,138,78,.10)"; ctx.fillRect(0, 0, W, 250); ctx.fillRect(0, H - 340, W, 340); ctx.restore();
    tracejado(ctx, function () { ctx.moveTo(0, 250); ctx.lineTo(W, 250); ctx.moveTo(0, H - 340); ctx.lineTo(W, H - 340); });
    rotulo(ctx, "ÁREA COBERTA PELO PERFIL", W / 2, 200, { tam: 18, cor: COR_GUIA, alinhar: "centro" });
    rotulo(ctx, "ÁREA COBERTA PELA RESPOSTA", W / 2, H - 316, { tam: 18, cor: COR_GUIA, alinhar: "centro" });
  }
  function guiaReels(ctx, W, H, o) {
    if (!o.guia) return;
    tracejado(ctx, function () { ctx.rect(4, (H - 1440) / 2, W - 8, 1440); ctx.rect(4, (H - 1080) / 2, W - 8, 1080); });
    rotulo(ctx, "RECORTE NA GRADE DO PERFIL (3:4)", W / 2, (H - 1440) / 2 + 18, { tam: 18, cor: COR_GUIA, alinhar: "centro" });
    rotulo(ctx, "RECORTE QUADRADO (1:1)", W / 2, (H - 1080) / 2 + 18, { tam: 18, cor: COR_GUIA, alinhar: "centro" });
  }

  /* ── Ícones de linha (grade de 100 × 100) ────────────────── */
  var ICONES = {
    pessoa: ["Pessoa", function (c) { c.arc(50, 33, 15, 0, Math.PI * 2); c.moveTo(80, 84); c.arc(50, 84, 30, 0, Math.PI, true); }],
    maleta: ["Maleta", function (c) { c.rect(16, 34, 68, 46); c.moveTo(38, 34); c.lineTo(38, 24); c.lineTo(62, 24); c.lineTo(62, 34); c.moveTo(16, 54); c.lineTo(84, 54); }],
    grafico: ["Gráfico", function (c) { c.moveTo(18, 16); c.lineTo(18, 82); c.lineTo(84, 82); c.moveTo(28, 66); c.lineTo(44, 48); c.lineTo(58, 58); c.lineTo(80, 32); c.moveTo(68, 32); c.lineTo(80, 32); c.lineTo(80, 44); }],
    lampada: ["Lâmpada", function (c) { c.arc(50, 42, 22, Math.PI * .8, Math.PI * .2); c.lineTo(60, 68); c.lineTo(40, 68); c.closePath(); c.moveTo(40, 77); c.lineTo(60, 77); c.moveTo(44, 86); c.lineTo(56, 86); }],
    calendario: ["Calendário", function (c) { c.rect(18, 24, 64, 58); c.moveTo(18, 40); c.lineTo(82, 40); c.moveTo(34, 16); c.lineTo(34, 30); c.moveTo(66, 16); c.lineTo(66, 30); c.moveTo(30, 54); c.lineTo(42, 54); c.moveTo(58, 54); c.lineTo(70, 54); c.moveTo(30, 68); c.lineTo(42, 68); }],
    livro: ["Livro", function (c) { c.moveTo(50, 28); c.lineTo(16, 22); c.lineTo(16, 74); c.lineTo(50, 80); c.lineTo(84, 74); c.lineTo(84, 22); c.closePath(); c.moveTo(50, 28); c.lineTo(50, 80); }],
    camera: ["Câmera", function (c) { c.rect(14, 32, 72, 48); c.moveTo(36, 32); c.lineTo(41, 22); c.lineTo(59, 22); c.lineTo(64, 32); c.moveTo(63, 56); c.arc(50, 56, 13, 0, Math.PI * 2); }],
    mensagem: ["Mensagem", function (c) { c.moveTo(16, 20); c.lineTo(84, 20); c.lineTo(84, 66); c.lineTo(48, 66); c.lineTo(30, 82); c.lineTo(32, 66); c.lineTo(16, 66); c.closePath(); }],
    casa: ["Casa", function (c) { c.moveTo(14, 48); c.lineTo(50, 18); c.lineTo(86, 48); c.moveTo(26, 40); c.lineTo(26, 82); c.lineTo(74, 82); c.lineTo(74, 40); c.moveTo(43, 82); c.lineTo(43, 60); c.lineTo(57, 60); c.lineTo(57, 82); }],
    escudo: ["Escudo", function (c) { c.moveTo(50, 14); c.lineTo(82, 26); c.lineTo(82, 50); c.quadraticCurveTo(82, 74, 50, 88); c.quadraticCurveTo(18, 74, 18, 50); c.lineTo(18, 26); c.closePath(); c.moveTo(36, 50); c.lineTo(46, 60); c.lineTo(65, 40); }],
    alvo: ["Alvo", function (c) { c.arc(50, 50, 34, 0, Math.PI * 2); c.moveTo(72, 50); c.arc(50, 50, 22, 0, Math.PI * 2); c.moveTo(60, 50); c.arc(50, 50, 10, 0, Math.PI * 2); }],
    relogio: ["Relógio", function (c) { c.arc(50, 50, 34, 0, Math.PI * 2); c.moveTo(50, 50); c.lineTo(50, 28); c.moveTo(50, 50); c.lineTo(65, 58); }],
    check: ["Confirmado", function (c) { c.arc(50, 50, 34, 0, Math.PI * 2); c.moveTo(35, 51); c.lineTo(46, 62); c.lineTo(66, 40); }],
    estrela: ["Estrela", function (c) { for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 15 : 36; c[i ? "lineTo" : "moveTo"](50 + r * Math.cos(a), 53 + r * Math.sin(a)); } c.closePath(); }],
    moeda: ["Moeda (R$)", function (c) { c.arc(50, 50, 34, 0, Math.PI * 2); }, "R$"],
    pergunta: ["Pergunta", null, "?"],
    aspas: ["Aspas", null, "“"]
  };
  function icone(ctx, nome, cx, cy, tam, cor) {
    var ic = ICONES[nome] || ICONES.pessoa, s = tam / 100;
    ctx.save();
    ctx.translate(cx - tam / 2, cy - tam / 2); ctx.scale(s, s);
    ctx.strokeStyle = cor; ctx.lineWidth = 2.6; ctx.lineJoin = "miter"; ctx.lineCap = "square";
    if (ic[1]) { ctx.beginPath(); ic[1](ctx); ctx.stroke(); }
    if (ic[2]) {
      var tm = ic[1] ? 30 : 100;
      fonte(ctx, ic[1] ? 300 : 200, tm, "serif");
      ctx.fillStyle = cor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(ic[2], 50, ic[2] === "“" ? 72 : 54);
      ctx.textAlign = "left";
    }
    ctx.restore();
  }
  var OP_ICONES = Object.keys(ICONES).map(function (k) { return [k, ICONES[k][0]]; });

  /* ── Modelos ─────────────────────────────────────────────── */
  var GRUPOS = [
    ["identidade", "IDENTIDADE VISUAL"], ["destaques", "CAPAS DE DESTAQUE"], ["carrossel", "CARROSSEL"], ["posts", "POSTS"],
    ["stories", "STORIES"], ["reels", "CAPAS DE REELS"], ["stickers", "STICKERS"], ["edicao", "EDIÇÃO DE REELS"], ["salvos", "MEUS MODELOS"]
  ];
  var INTRO = {
    identidade: "Os arquivos oficiais da identidade visual (logos, fotos de perfil, bases para o Canva, fontes), a paleta e as regras de uso. Toque em qualquer arquivo para baixar.",
    destaques: "Baixe a capa e, no Instagram, abra o destaque › Editar destaque › Editar capa. O nome do destaque é digitado no próprio Instagram, não na imagem. Use o mesmo fundo em todas as capas para o perfil ficar uniforme.",
    carrossel: "Monte os slides, troque o fundo de cada um e baixe tudo de uma vez. Entre 5 e 10 slides funciona bem; o formato 4:5 ocupa mais espaço no feed. Uma ideia por post, título com até 12 palavras.",
    posts: "Posts de uma imagem só. Alterne fundo petróleo e papel entre publicações e evite três posts escuros seguidos.",
    stories: "A área tracejada marca onde colocar o sticker interativo do Instagram (pergunta, enquete, link, contagem). As faixas de cima e de baixo ficam cobertas pela interface, então nada importante vai ali.",
    reels: "A capa é vertical (1080 × 1920), mas aparece cortada em 3:4 na grade do perfil. Mantenha o texto dentro do recorte marcado. No Instagram: Editar capa › Adicionar da galeria.",
    stickers: "PNG com fundo transparente. No story, toque no ícone de figurinha › Galeria (ou copie a imagem e cole no story) e ajuste o tamanho com dois dedos.",
    edicao: "Sobreposições em 1080 × 1920 para usar no Edits, CapCut ou no editor do Instagram. Os PNGs transparentes já entram no lugar certo quando ocupam a tela inteira; as cartelas são telas cheias para abrir e fechar o vídeo.",
    salvos: "Os modelos que você salvar aparecem aqui. Eles ficam guardados neste navegador: em outro computador ou celular a lista começa vazia."
  };
  var PAUTAS = [
    "Reserva de emergência: quanto é o suficiente?", "Como dividir as contas do casal", "PGBL ou VGBL: qual faz sentido para você",
    "Quanto custa criar um filho até os 18 anos", "Seguro de vida: quem realmente precisa", "Imposto de renda: o que organizar desde janeiro",
    "Profissional liberal: como separar o dinheiro da PF e da PJ", "Aposentadoria: o número que você precisa conhecer", "Dívidas: por qual começar a pagar",
    "Metas de curto, médio e longo prazo", "O que é planejamento financeiro (e o que não é)", "Bastidores: como funciona o diagnóstico"
  ];
  var DESTAQUES = [
    ["Sobre", "pessoa"], ["Serviços", "maleta"], ["Diagnóstico", "grafico"], ["Dicas", "lampada"], ["Dúvidas", "pergunta"],
    ["Clientes", "aspas"], ["Agenda", "calendario"], ["Conteúdo", "livro"], ["Bastidores", "camera"], ["Contato", "mensagem"],
    ["Proteção", "escudo"], ["Metas", "alvo"]
  ];
  var ETIQUETAS = ["DICA", "MITO OU VERDADE?", "VOCÊ SABIA?", "NOVO POST", "LINK NA BIO", "SALVE ESTE POST", "PERGUNTA DA SEMANA", "BASTIDORES", "ARRASTE →", "AO VIVO", "LEIA A LEGENDA", "MITO", "VERDADE"];

  var TPL = {}, ORDEM = [];
  function modelo(t) { TPL[t.id] = t; ORDEM.push(t); }
  function dims(tpl, v) { return tpl.formato ? FORMATOS[v.formato] || FORMATOS[tpl.formato] : [tpl.w, tpl.h]; }

  var C_FORMATO = ["formato", "Formato", "opcoes", OP_FEED];
  var C_AVISO = [["aviso", "Incluir aviso legal (quando cita produto ou desempenho)", "check"], ["avisoTexto", "Texto do aviso", "texto"]];
  var AVISO_PADRAO = "Conteúdo educativo. Não é recomendação de investimento.";

  /* Identidade visual ─────────────────────────────────────── */
  modelo({
    id: "padrao", grupo: "identidade", nome: "Padrão tipográfico", desc: "Fundo com o monograma repetido, para capas e aberturas.", formato: "9:16",
    campos: [["formato", "Formato", "opcoes", [["9:16", "Story/Reels 9:16"], ["4:5", "Feed 4:5"], ["1:1", "Quadrado 1:1"]]], ["tema", "Fundo", "tema", ["petroleo", "noite", "papel"]], ["densidade", "Densidade", "opcoes", [["larga", "Larga (padrão da marca)"], ["media", "Média"], ["densa", "Densa (limite)"]]]],
    padrao: { formato: "9:16", tema: "petroleo", densidade: "larga" },
    dicas: "Texto sempre por cima de um bloco liso de cor, nunca direto sobre o padrão.",
    desenhar: function (ctx, W, H, v) { var t = TEMAS[v.tema]; fundo(ctx, W, H, t.fundo); padrao(ctx, W, H, t.padrao, v.densidade); }
  });

  /* Capas de destaque ─────────────────────────────────────── */
  modelo({
    id: "destaque", grupo: "destaques", nome: "Capa de destaque", w: 1080, h: 1920, guia: true,
    campos: [["tema", "Fundo", "tema", ["petroleo", "noite", "papel", "nevoa", "cobre"]], ["estilo", "Estilo", "opcoes", [["icone", "Ícone de linha"], ["letra", "Letra ou número"], ["palavra", "Palavra"]]],
      ["icone", "Ícone", "opcoes", OP_ICONES], ["texto", "Letra, número ou palavra", "texto"], ["aro", "Aro fino ao redor", "check"]],
    padrao: { tema: "petroleo", estilo: "icone", icone: "pessoa", texto: "S", aro: true },
    variantes: DESTAQUES.map(function (d) { return { nome: d[0], desc: "Sugestão de destaque", valores: { icone: d[1], texto: d[0].charAt(0) } }; }),
    kit: function (v) { return DESTAQUES.map(function (d) { return { nome: d[0], v: ext(v, { icone: d[1], texto: v.estilo === "palavra" ? d[0] : d[0].charAt(0) }) }; }); },
    kitNome: "BAIXAR AS 12 SUGESTÕES (.ZIP)",
    dicas: "Sugestões de nomes: " + DESTAQUES.map(function (d) { return d[0]; }).join(", ") + ".",
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.tema] || TEMAS.petroleo, cor = v.tema === "cobre" ? COR.noite : t.escuro ? COR.papel : COR.petroleo;
      var acento = v.tema === "cobre" ? COR.noite : COR.cobre, cx = W / 2, cy = H / 2;
      fundo(ctx, W, H, t.fundo);
      if (v.aro) { ctx.save(); ctx.strokeStyle = acento; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, 340, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      if (v.estilo === "icone") icone(ctx, v.icone, cx, cy, 360, cor);
      else if (v.estilo === "letra") {
        fonte(ctx, pesoT(t), 400, "serif");
        ctx.fillStyle = cor; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(v.texto || "").slice(0, 3), cx, cy + 16); ctx.textAlign = "left";
      } else {
        var txt = String(v.texto || "").toUpperCase(), tam = 72;
        fonte(ctx, 500, tam, "sans");
        while (tam > 30 && larguraEsp(ctx, txt, tam * .2) > 560) { tam -= 4; fonte(ctx, 500, tam, "sans"); }
        rotulo(ctx, txt, cx, cy - tam * .6, { tam: tam, cor: cor, esp: .2, alinhar: "centro" });
        ctx.fillStyle = acento; ctx.fillRect(cx - 50, cy + tam * .75, 100, 3);
      }
      if (o.guia) {
        tracejado(ctx, function () { ctx.arc(cx, cy, 540, 0, Math.PI * 2); });
        rotulo(ctx, "RECORTE DO DESTAQUE", cx, cy - 600, { tam: 22, cor: COR_GUIA, alinhar: "centro" });
      }
    }
  });

  /* Carrossel ─────────────────────────────────────────────── */
  var TIPOS_SLIDE = {
    capa: ["Capa", [["titulo", "Título", "area"], ["sub", "Linha de apoio", "area"]]],
    texto: ["Texto", [["numero", "Número ou palavra em destaque (opcional)", "texto"], ["titulo", "Título", "area"], ["corpo", "Texto", "area"]]],
    lista: ["Lista", [["titulo", "Título", "area"], ["itens", "Itens (um por linha)", "area"]]],
    numero: ["Número em destaque", [["destaque", "Número", "texto"], ["legenda", "Legenda", "area"], ["nota", "Fonte ou observação", "texto"]]],
    citacao: ["Citação", [["frase", "Frase", "area"], ["autor", "Autor", "texto"]]],
    fechamento: ["Fechamento", [["titulo", "Título", "area"], ["corpo", "Texto", "area"], ["botao", "Chamada (botão)", "texto"]]]
  };
  var SLIDE_NOVO = {
    capa: { titulo: "Título do carrossel em até doze palavras", sub: "Uma linha de apoio que dá vontade de arrastar." },
    texto: { numero: "01", titulo: "Título do slide", corpo: "Explique a ideia em duas ou três frases curtas, com números explicados." },
    lista: { titulo: "Os passos", itens: "Primeiro passo\nSegundo passo\nTerceiro passo" },
    numero: { destaque: "6×", legenda: "o seu custo fixo mensal é a referência mínima para a reserva.", nota: "" },
    citacao: { frase: "Orçamento não é sobre cortar. É sobre escolher para onde o dinheiro vai.", autor: "Vitor Hugo Germano" },
    fechamento: { titulo: "Vamos olhar o seu caso?", corpo: "A primeira conversa é sem custo e sem proposta de produto.", botao: "AGENDAR NO LINK DA BIO" }
  };
  function slide(tipo, tema, campos) { return ext(ext({ tipo: tipo, tema: tema }, SLIDE_NOVO[tipo]), campos || {}); }
  function desenharSlide(ctx, W, H, g, s, i, n) {
    var t = TEMAS[s.tema] || TEMAS.petroleo, M = 72, P = pesoT(t), ultimo = i === n - 1;
    fundo(ctx, W, H, t.fundo);
    cabecalho(ctx, W, M, t, g.rotulo, g.paginacao ? dois(i + 1) + " / " + dois(n) : "");
    var hr = rodape(ctx, W, H, M, t, !ultimo && g.arraste ? "ARRASTE →" : "");
    if (g.aviso) aviso(ctx, W, H, M, t, g.avisoTexto);
    var y0 = M + 90, y1 = H - M - hr - 60, x = M, larg = W - 2 * M;
    var serif = function (tam, o) { return ext({ fam: "serif", peso: P, tam: tam, lh: 1.12, cor: t.titulo, equilibrar: true }, o || {}); };
    var sans = function (tam, o) { return ext({ fam: "sans", peso: 400, tam: tam, lh: 1.6, cor: t.texto }, o || {}); };
    var montar = {
      capa: function (k) { return [T(s.titulo, serif(112 * k, { lh: 1.1 })), Fio(160, t.fio, 52 * k), T(s.sub, sans(30 * k, { larg: 800, antes: 40 * k }))]; },
      texto: function (k) { return [T(s.numero, serif(120 * k, { peso: 300, cor: COR.cobre, lh: 1, equilibrar: false })), T(s.titulo, serif(76 * k, { antes: 28 * k })), Fio(100, t.fio, 44 * k), T(s.corpo, sans(32 * k, { antes: 36 * k }))]; },
      lista: function (k) {
        var itens = String(s.itens || "").split("\n").filter(function (l) { return l.trim(); });
        return [T(s.titulo, serif(76 * k)), itens.map(function (l, j) { return ItemLista(j + 1, l, t, 30 * k, j ? 0 : 48 * k); })];
      },
      numero: function (k) { return [T(s.destaque, serif(280 * k, { peso: 200, cor: COR.cobre, lh: 1 })), Fio(120, t.fio, 44 * k), T(s.legenda, serif(60 * k, { lh: 1.2, antes: 40 * k })), T(s.nota, sans(22, { cor: t.suave, antes: 32 * k }))]; },
      citacao: function (k) { return [T("“", serif(220 * k, { peso: 200, cor: COR.cobre, lh: .62, equilibrar: false })), T(s.frase, serif(68 * k, { peso: 300, it: true, lh: 1.25, antes: 8 })), Fio(100, t.fio, 48 * k), R(s.autor, { tam: 20, cor: t.rotulo, antes: 32 * k })]; },
      fechamento: function (k) { return [T(s.titulo, serif(92 * k)), T(s.corpo, sans(32 * k, { larg: 820, antes: 36 * k })), Botao(s.botao, t, { antes: 60 * k })]; }
    };
    pilhaAjustada(ctx, montar[s.tipo] || montar.texto, x, larg, y0, y1, "centro", "esq");
  }
  var C_CARROSSEL = [C_FORMATO, ["rotulo", "Tema (rótulo no topo de todos os slides)", "texto"], ["paginacao", "Mostrar numeração (01 / 05)", "check"], ["arraste", "Mostrar “ARRASTE →” no pé", "check"]].concat(C_AVISO);
  function carrossel(rot, slides, extra) { return ext({ formato: "4:5", rotulo: rot, paginacao: true, arraste: true, aviso: false, avisoTexto: AVISO_PADRAO, slides: slides }, extra || {}); }
  modelo({
    id: "carrossel", grupo: "carrossel", nome: "Carrossel", formato: "4:5", carrossel: true,
    campos: C_CARROSSEL,
    padrao: carrossel("DICAS RÁPIDAS", [
      slide("capa", "petroleo", { titulo: "3 erros que atrasam sua reserva de emergência", sub: "O primeiro aparece antes de você guardar o primeiro real." }),
      slide("texto", "papel", { numero: "01", titulo: "Guardar só o que sobra", corpo: "Quem espera o fim do mês quase nunca encontra sobra. Separe o valor da reserva no dia em que o salário cai." }),
      slide("texto", "papel", { numero: "02", titulo: "Deixar o dinheiro na conta corrente", corpo: "Parado na conta, ele perde para a inflação e fica fácil de gastar. A reserva pede liquidez diária e baixo risco." }),
      slide("texto", "papel", { numero: "03", titulo: "Não saber o tamanho da meta", corpo: "A referência é de 6 a 12 meses do seu custo fixo. Sem esse número, não dá para saber quando parar." }),
      slide("fechamento", "petroleo", { titulo: "Quer calcular a sua reserva ideal?", corpo: "Na primeira conversa, sem custo, a gente olha os seus números e define a meta do seu caso." })
    ]),
    variantes: [
      { nome: "Dicas rápidas", desc: "Capa, três dicas e convite. O modelo do manual." },
      { nome: "Passo a passo", desc: "Capa, lista numerada, citação e fechamento.", valores: carrossel("PASSO A PASSO", [
        slide("capa", "petroleo", { titulo: "Como montar seu orçamento mensal em 4 passos", sub: "Leva uma tarde e muda o resto do ano." }),
        slide("lista", "papel", { titulo: "O caminho", itens: "Liste tudo o que entra no mês\nSepare os gastos fixos dos variáveis\nDefina um limite para cada categoria\nRevise no fim do mês e ajuste" }),
        slide("citacao", "nevoa", {}),
        slide("fechamento", "petroleo", { titulo: "Salve este post para fazer no próximo dia 1.", corpo: "E mande para quem divide as contas com você.", botao: "SALVAR" })
      ]) },
      { nome: "Mito ou verdade", desc: "Frases comuns sobre dinheiro, com a resposta em cada slide.", valores: carrossel("MITO OU VERDADE", [
        slide("capa", "noite", { titulo: "Mito ou verdade: 3 frases sobre investir", sub: "Arraste e confira antes de decidir." }),
        slide("texto", "papel", { numero: "Mito", titulo: "“Preciso de muito dinheiro para começar.”", corpo: "Dá para começar com pouco. O que mais pesa é a constância, com a reserva de emergência pronta antes." }),
        slide("texto", "papel", { numero: "Verdade", titulo: "“Taxa alta come o rendimento.”", corpo: "Uma diferença de 1% ao ano pesa muito em prazos longos. Vale olhar a taxa antes de olhar o produto." }),
        slide("texto", "papel", { numero: "Mito", titulo: "“Imóvel nunca perde valor.”", corpo: "Imóvel também oscila, tem custo de manutenção e demora para vender. Ele é uma parte do plano, não o plano todo." }),
        slide("fechamento", "noite", { titulo: "Ficou alguma dúvida?", corpo: "Mande nos comentários que eu respondo no próximo post.", botao: "COMENTAR" })
      ], { aviso: true }) },
      { nome: "Em branco", desc: "Capa, um slide de texto e fechamento para começar do zero.", valores: carrossel("TEMA", [slide("capa", "petroleo"), slide("texto", "papel"), slide("fechamento", "petroleo")]) }
    ],
    desenhar: function (ctx, W, H, v, o) {
      var n = v.slides.length, i = Math.min(o.slide || 0, n - 1);
      desenharSlide(ctx, W, H, v, v.slides[i], i, n);
    }
  });

  /* Posts ─────────────────────────────────────────────────── */
  modelo({
    id: "convite", grupo: "posts", nome: "Convite", desc: "Uma chamada e um botão. Nunca mais de uma ação por post.", formato: "4:5",
    campos: [C_FORMATO, ["tema", "Fundo", "tema", T_FEED], ["rotulo", "Rótulo", "texto"], ["titulo", "Chamada", "area"], ["texto", "Texto", "area"], ["botao", "Botão", "texto"]].concat(C_AVISO),
    padrao: { formato: "4:5", tema: "papel", rotulo: "CONVERSA", titulo: "Vamos revisar seu plano em 30 minutos?", texto: "Conversa sem custo e sem proposta de produto. Você sai com as três prioridades do seu caso.", botao: "AGENDAR NO LINK DA BIO", aviso: false, avisoTexto: AVISO_PADRAO },
    desenhar: function (ctx, W, H, v) {
      var t = TEMAS[v.tema] || TEMAS.papel, M = 72;
      fundo(ctx, W, H, t.fundo); cabecalho(ctx, W, M, t, v.rotulo);
      var hr = rodape(ctx, W, H, M, t, ""), b = Botao(v.botao, t);
      if (v.aviso) aviso(ctx, W, H, M, t, v.avisoTexto);
      var yb = H - M - hr - 56 - (b ? b.medir() : 0);
      if (b) b.desenhar(ctx, M, yb, W - 2 * M, "esq");
      pilhaAjustada(ctx, function (k) { return [T(v.titulo, { fam: "serif", peso: pesoT(t), tam: 100 * k, lh: 1.15, cor: t.titulo, equilibrar: true }), T(v.texto, { fam: "sans", tam: 28 * k, lh: 1.65, cor: t.texto, larg: 820, antes: 44 * k })]; },
        M, W - 2 * M, M + 90, yb - 48, "centro", "esq");
    }
  });
  modelo({
    id: "apresentacao", grupo: "posts", nome: "Apresentação", desc: "Foto em cima, faixa petróleo embaixo. Sem texto sobre a foto.", formato: "4:5",
    campos: [C_FORMATO, ["foto", "Foto", "foto"], ["focoY", "Enquadramento vertical da foto", "faixa", [0, 100]], ["nome", "Nome", "texto"], ["texto", "Texto", "area"]],
    padrao: { formato: "4:5", foto: RETRATO, focoY: 30, nome: "Vitor Hugo Germano", texto: "Planejamento financeiro para famílias e profissionais liberais. Botucatu e online." },
    desenhar: function (ctx, W, H, v) {
      var t = TEMAS.petroleo, fx = Math.round(H / 3), M = 72;
      foto(ctx, v.foto, 0, 0, W, H - fx, v.focoY);
      ctx.fillStyle = t.fundo; ctx.fillRect(0, H - fx, W, fx);
      pilhaAjustada(ctx, function (k) { return [T(v.nome, { fam: "serif", peso: 200, tam: 76 * k, lh: 1.1, cor: t.titulo }), Fio(120, t.fio, 28 * k), T(v.texto, { fam: "sans", tam: 26 * k, lh: 1.6, cor: t.texto, larg: 820, antes: 28 * k })]; },
        M, W - 2 * M, H - fx + 56, H - 56, "centro", "esq");
    }
  });
  modelo({
    id: "frase", grupo: "posts", nome: "Frase", desc: "Citação em itálico. Para opinião e fechamento de ideia.", formato: "4:5",
    campos: [C_FORMATO, ["tema", "Fundo", "tema", T_FEED], ["rotulo", "Rótulo (opcional)", "texto"], ["frase", "Frase", "area"], ["autor", "Autor", "texto"]],
    padrao: { formato: "4:5", tema: "petroleo", rotulo: "", frase: "Planejar não é prever o futuro. É estar pronto para ele.", autor: "Vitor Hugo Germano" },
    desenhar: function (ctx, W, H, v) {
      var t = TEMAS[v.tema] || TEMAS.petroleo, M = 72;
      fundo(ctx, W, H, t.fundo); cabecalho(ctx, W, M, t, v.rotulo);
      var hr = rodape(ctx, W, H, M, t, "");
      pilhaAjustada(ctx, function (k) { return [T("“", { fam: "serif", peso: 200, tam: 240 * k, lh: .62, cor: COR.cobre }), T(v.frase, { fam: "serif", peso: 300, it: true, tam: 80 * k, lh: 1.22, cor: t.titulo, equilibrar: true, antes: 8 }), Fio(100, t.fio, 52 * k), R(v.autor, { tam: 20, cor: t.rotulo, antes: 32 * k })]; },
        M, W - 2 * M, M + 70, H - M - hr - 60, "centro", "esq");
    }
  });
  modelo({
    id: "numero", grupo: "posts", nome: "Número em destaque", desc: "Um número grande e o que ele quer dizer.", formato: "4:5",
    campos: [C_FORMATO, ["tema", "Fundo", "tema", T_FEED], ["rotulo", "Rótulo", "texto"], ["destaque", "Número", "texto"], ["legenda", "O que o número quer dizer", "area"], ["nota", "Fonte ou observação", "texto"]].concat(C_AVISO),
    padrao: { formato: "4:5", tema: "papel", rotulo: "VOCÊ SABIA?", destaque: "6 a 12", legenda: "meses do seu custo fixo é o tamanho de uma boa reserva de emergência.", nota: "Referência usada no diagnóstico VHG.", aviso: false, avisoTexto: AVISO_PADRAO },
    desenhar: function (ctx, W, H, v) {
      var t = TEMAS[v.tema] || TEMAS.papel, M = 72;
      fundo(ctx, W, H, t.fundo); cabecalho(ctx, W, M, t, v.rotulo);
      var hr = rodape(ctx, W, H, M, t, "");
      if (v.aviso) aviso(ctx, W, H, M, t, v.avisoTexto);
      pilhaAjustada(ctx, function (k) { return [T(v.destaque, { fam: "serif", peso: 200, tam: 260 * k, lh: 1, cor: COR.cobre }), Fio(120, t.fio, 44 * k), T(v.legenda, { fam: "serif", peso: pesoT(t) + 100, tam: 58 * k, lh: 1.2, cor: t.titulo, equilibrar: true, antes: 40 * k }), T(v.nota, { fam: "sans", tam: 22, lh: 1.5, cor: t.suave, antes: 32 * k })]; },
        M, W - 2 * M, M + 90, H - M - hr - 60, "centro", "esq");
    }
  });
  modelo({
    id: "comunicado", grupo: "posts", nome: "Comunicado com padrão", desc: "Bloco liso sobre o padrão da marca. Para novidade, agenda ou aviso.", formato: "4:5",
    campos: [C_FORMATO, ["tema", "Fundo", "tema", ["petroleo", "noite", "papel"]], ["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"], ["texto", "Texto", "area"]],
    padrao: { formato: "4:5", tema: "noite", rotulo: "NOVIDADE", titulo: "Agenda de novembro aberta para novos clientes", texto: "Quatro vagas para o planejamento completo. Garanta a sua pelo link da bio." },
    desenhar: function (ctx, W, H, v) {
      var t = TEMAS[v.tema] || TEMAS.noite, M = 72, pad = 64;
      fundo(ctx, W, H, t.fundo); padrao(ctx, W, H, t.padrao, "larga");
      var hr = 88, x = M + pad, larg = W - 2 * M - 2 * pad, y0 = M + pad, y1 = H - M - hr - 48 - pad;
      var itens = function (k) { return [R(v.rotulo, { tam: 20, cor: t.rotulo }), T(v.titulo, { fam: "serif", peso: pesoT(t), tam: 92 * k, lh: 1.12, cor: t.titulo, equilibrar: true, antes: 32 * k }), Fio(120, t.fio, 44 * k), T(v.texto, { fam: "sans", tam: 28 * k, lh: 1.6, cor: t.texto, antes: 36 * k })]; };
      var r = pilhaAjustada(ctx, itens, x, larg, y0, y1, "centro", "esq", true);
      ctx.fillStyle = t.fundo; ctx.fillRect(M, r.y - pad, W - 2 * M, r.h + 2 * pad);
      ctx.fillRect(M - 8, H - M - hr - 8, W - 2 * M + 16, hr + 16);
      pilhaAjustada(ctx, itens, x, larg, y0, y1, "centro", "esq");
      rodape(ctx, W, H, M, t, "");
    }
  });

  /* Stories ───────────────────────────────────────────────── */
  var SM = 88, STOPO = 270, SBASE = 1920 - 360;
  function story(id, nome, desc, temaPadrao, campos, padraoV, desenhar) {
    modelo({ id: id, grupo: "stories", nome: nome, desc: desc, w: 1080, h: 1920, guia: true,
      campos: [["tema", "Fundo", "tema", T_FEED]].concat(campos), padrao: ext({ tema: temaPadrao }, padraoV),
      desenhar: function (ctx, W, H, v, o) {
        var t = TEMAS[v.tema] || TEMAS.petroleo;
        fundo(ctx, W, H, t.fundo);
        desenhar(ctx, W, H, v, o, t);
        guiaStory(ctx, W, H, o);
      } });
  }
  function sTitulo(t, k, tam) { return { fam: "serif", peso: pesoT(t), tam: (tam || 100) * k, lh: 1.1, cor: t.titulo, equilibrar: true }; }
  function sTexto(t, k, antes) { return { fam: "sans", tam: 34 * k, lh: 1.55, cor: t.texto, antes: antes }; }
  story("s-pergunta", "Caixa de perguntas", "Chamada com espaço para o sticker de perguntas.", "petroleo",
    [["rotulo", "Rótulo", "texto"], ["titulo", "Pergunta", "area"], ["texto", "Texto de apoio", "area"]],
    { rotulo: "CAIXA DE PERGUNTAS", titulo: "O que você quer saber sobre aposentadoria?", texto: "Respondo as melhores perguntas aqui nos stories durante a semana." },
    function (ctx, W, H, v, o, t) {
      rotulo(ctx, v.rotulo, SM, STOPO, { tam: 24, cor: t.rotulo, esp: .26 });
      pilhaAjustada(ctx, function (k) { return [T(v.titulo, sTitulo(t, k, 104)), Fio(140, t.fio, 48 * k), T(v.texto, sTexto(t, k, 36 * k))]; }, SM, W - 2 * SM, STOPO + 90, 1060, "topo", "esq");
      zonaSticker(ctx, o, SM + 60, 1130, W - 2 * SM - 120, 300, "STICKER DE PERGUNTAS");
      rodapeStory(ctx, W, SBASE - 100, t);
    });
  story("s-enquete", "Mito ou verdade", "Afirmação com espaço para o sticker de enquete.", "papel",
    [["rotulo", "Rótulo", "texto"], ["titulo", "Afirmação", "area"], ["texto", "Texto de apoio", "area"]],
    { rotulo: "MITO OU VERDADE?", titulo: "“Preciso de muito dinheiro para começar a investir.”", texto: "Vote aqui embaixo. A resposta sai no próximo story." },
    function (ctx, W, H, v, o, t) {
      rotulo(ctx, v.rotulo, SM, STOPO, { tam: 24, cor: t.rotulo, esp: .26 });
      pilhaAjustada(ctx, function (k) { return [T(v.titulo, ext(sTitulo(t, k, 96), { peso: 300, it: true, lh: 1.18 })), Fio(140, t.fio, 48 * k), T(v.texto, sTexto(t, k, 36 * k))]; }, SM, W - 2 * SM, STOPO + 90, 1080, "topo", "esq");
      zonaSticker(ctx, o, SM + 60, 1160, W - 2 * SM - 120, 240, "STICKER DE ENQUETE");
      rodapeStory(ctx, W, SBASE - 100, t);
    });
  story("s-dica", "Dica rápida", "Número, título e explicação curta.", "petroleo",
    [["rotulo", "Rótulo", "texto"], ["numero", "Número (opcional)", "texto"], ["titulo", "Título", "area"], ["texto", "Explicação", "area"]],
    { rotulo: "DICA RÁPIDA", numero: "01", titulo: "Separe a reserva no dia do salário", texto: "Programe a transferência para o mesmo dia em que o dinheiro entra. O que não fica na conta não vira gasto." },
    function (ctx, W, H, v, o, t) {
      rotulo(ctx, v.rotulo, SM, STOPO, { tam: 24, cor: t.rotulo, esp: .26 });
      pilhaAjustada(ctx, function (k) { return [T(v.numero, { fam: "serif", peso: 200, tam: 200 * k, lh: 1, cor: COR.cobre }), T(v.titulo, ext(sTitulo(t, k, 100), { antes: 24 * k })), Fio(140, t.fio, 48 * k), T(v.texto, sTexto(t, k, 40 * k))]; }, SM, W - 2 * SM, STOPO + 90, SBASE - 180, "centro", "esq");
      rodapeStory(ctx, W, SBASE - 100, t);
    });
  story("s-link", "Link", "Chamada com espaço para o sticker de link.", "noite",
    [["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"], ["texto", "Texto", "area"], ["chamada", "Chamada acima do link", "texto"]],
    { rotulo: "NO SITE", titulo: "Faça o diagnóstico financeiro", texto: "Dez etapas, no seu tempo, e um relatório com as prioridades do seu caso.", chamada: "TOQUE NO LINK ↓" },
    function (ctx, W, H, v, o, t) {
      rotulo(ctx, v.rotulo, SM, STOPO, { tam: 24, cor: t.rotulo, esp: .26 });
      pilhaAjustada(ctx, function (k) { return [T(v.titulo, sTitulo(t, k, 110)), Fio(140, t.fio, 48 * k), T(v.texto, sTexto(t, k, 36 * k))]; }, SM, W - 2 * SM, STOPO + 90, 1060, "topo", "esq");
      if (!vazio(v.chamada)) rotulo(ctx, v.chamada, W / 2, 1150, { tam: 24, cor: t.titulo, esp: .22, alinhar: "centro" });
      zonaSticker(ctx, o, W / 2 - 300, 1210, 600, 150, "STICKER DE LINK");
      rodapeStory(ctx, W, SBASE - 100, t);
    });
  story("s-novo-post", "Novo post", "Para compartilhar um post do feed nos stories.", "papel",
    [["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"], ["chamada", "Chamada abaixo do post", "texto"]],
    { rotulo: "NOVO POST NO FEED", titulo: "3 erros que atrasam a sua reserva", chamada: "TOQUE NO POST PARA LER" },
    function (ctx, W, H, v, o, t) {
      rotulo(ctx, v.rotulo, SM, STOPO, { tam: 24, cor: t.rotulo, esp: .26 });
      pilhaAjustada(ctx, function (k) { return [T(v.titulo, sTitulo(t, k, 84))]; }, SM, W - 2 * SM, STOPO + 70, 620, "topo", "esq");
      ctx.fillStyle = t.fio; ctx.fillRect(SM, 650, 140, 2);
      zonaSticker(ctx, o, W / 2 - 310, 720, 620, 775, "POST COMPARTILHADO");
      if (!vazio(v.chamada)) rotulo(ctx, v.chamada, W / 2, 1520, { tam: 22, cor: t.titulo, esp: .22, alinhar: "centro" });
    });
  story("s-agenda", "Agenda ou live", "Data em destaque e espaço para a contagem regressiva.", "noite",
    [["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"], ["data", "Data e hora", "texto"], ["texto", "Texto", "area"]],
    { rotulo: "AO VIVO", titulo: "Como organizar o 13º salário", data: "12 NOV · 19H", texto: "Uma conversa de 30 minutos, com perguntas no final." },
    function (ctx, W, H, v, o, t) {
      rotulo(ctx, v.rotulo, SM, STOPO, { tam: 24, cor: t.rotulo, esp: .26 });
      pilhaAjustada(ctx, function (k) { return [T(v.titulo, sTitulo(t, k, 104)), T(v.data, { fam: "serif", peso: 300, tam: 84 * k, lh: 1.1, cor: COR.cobre, antes: 44 * k }), Fio(140, t.fio, 48 * k), T(v.texto, sTexto(t, k, 36 * k))]; }, SM, W - 2 * SM, STOPO + 90, 1100, "topo", "esq");
      zonaSticker(ctx, o, SM + 60, 1170, W - 2 * SM - 120, 230, "STICKER DE CONTAGEM REGRESSIVA");
      rodapeStory(ctx, W, SBASE - 100, t);
    });
  modelo({
    id: "s-foto", grupo: "stories", nome: "Bastidores com foto", desc: "Foto em cima e faixa com texto embaixo.", w: 1080, h: 1920, guia: true,
    campos: [["foto", "Foto", "foto"], ["focoY", "Enquadramento vertical da foto", "faixa", [0, 100]], ["tema", "Faixa", "tema", ["petroleo", "noite", "papel"]], ["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"], ["texto", "Texto", "area"]],
    padrao: { foto: RETRATO, focoY: 30, tema: "petroleo", rotulo: "BASTIDORES", titulo: "Hoje foi dia de entregar relatório", texto: "Cada plano sai com um passo a passo para os próximos 12 meses." },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.tema] || TEMAS.petroleo, yf = 1040;
      foto(ctx, v.foto, 0, 0, W, yf, v.focoY);
      ctx.fillStyle = t.fundo; ctx.fillRect(0, yf, W, H - yf);
      pilhaAjustada(ctx, function (k) { return [R(v.rotulo, { tam: 22, cor: t.rotulo }), T(v.titulo, ext(sTitulo(t, k, 84), { antes: 28 * k })), T(v.texto, sTexto(t, k, 28 * k))]; }, SM, W - 2 * SM, yf + 72, SBASE - 20, "topo", "esq");
      guiaStory(ctx, W, H, o);
    }
  });

  /* Capas de reels ────────────────────────────────────────── */
  modelo({
    id: "r-texto", grupo: "reels", nome: "Capa com título", desc: "Título centralizado, com ou sem o padrão da marca.", w: 1080, h: 1920, guia: true,
    campos: [["tema", "Fundo", "tema", T_FEED], ["padrao", "Usar o padrão tipográfico ao fundo", "check"], ["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"]],
    padrao: { tema: "petroleo", padrao: true, rotulo: "EM 60 SEGUNDOS", titulo: "Quanto guardar para a aposentadoria" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.tema] || TEMAS.petroleo, M = 110, pad = 72;
      fundo(ctx, W, H, t.fundo);
      var itens = function (k) { return [R(v.rotulo, { tam: 24, cor: t.rotulo }), T(v.titulo, { fam: "serif", peso: pesoT(t), tam: 124 * k, lh: 1.08, cor: t.titulo, equilibrar: true, antes: 44 * k }), Fio(160, t.fio, 60 * k)]; };
      if (v.padrao) {
        padrao(ctx, W, H, t.padrao, "larga");
        var r = pilhaAjustada(ctx, itens, M, W - 2 * M, 520, 1400, "centro", "centro", true);
        ctx.fillStyle = t.fundo; ctx.fillRect(M - pad, r.y - pad, W - 2 * M + 2 * pad, r.h + 2 * pad);
      }
      pilhaAjustada(ctx, itens, M, W - 2 * M, 520, 1400, "centro", "centro");
      guiaReels(ctx, W, H, o);
    }
  });
  modelo({
    id: "r-foto", grupo: "reels", nome: "Capa com foto", desc: "Foto de fundo e faixa com o título dentro do recorte.", w: 1080, h: 1920, guia: true,
    campos: [["foto", "Foto", "foto"], ["focoY", "Enquadramento vertical da foto", "faixa", [0, 100]], ["tema", "Faixa", "tema", ["petroleo", "noite", "papel"]], ["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"]],
    padrao: { foto: RETRATO, focoY: 25, tema: "petroleo", rotulo: "PERGUNTA DE CLIENTE", titulo: "Vale a pena quitar o financiamento antes?" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.tema] || TEMAS.petroleo, y0 = 1060, y1 = 1500, M = 96;
      foto(ctx, v.foto, 0, 0, W, H, v.focoY);
      ctx.fillStyle = t.fundo; ctx.fillRect(0, y0, W, y1 - y0);
      pilhaAjustada(ctx, function (k) { return [R(v.rotulo, { tam: 22, cor: t.rotulo }), T(v.titulo, { fam: "serif", peso: pesoT(t), tam: 84 * k, lh: 1.1, cor: t.titulo, equilibrar: true, antes: 28 * k })]; }, M, W - 2 * M, y0 + 60, y1 - 60, "centro", "esq");
      guiaReels(ctx, W, H, o);
    }
  });
  modelo({
    id: "r-serie", grupo: "reels", nome: "Capa de série", desc: "Para quadros fixos: nome da série, episódio e tema.", w: 1080, h: 1920, guia: true,
    campos: [["tema", "Fundo", "tema", T_FEED], ["serie", "Nome da série", "texto"], ["episodio", "Episódio", "texto"], ["titulo", "Tema do episódio", "area"]],
    padrao: { tema: "noite", serie: "DINHEIRO SEM JARGÃO", episodio: "EP. 03", titulo: "O que é CDI e por que todo mundo fala dele" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.tema] || TEMAS.noite, M = 110;
      fundo(ctx, W, H, t.fundo);
      pilhaAjustada(ctx, function (k) { return [R(v.serie, { tam: 24, cor: t.rotulo }), T(v.episodio, { fam: "serif", peso: 200, tam: 170 * k, lh: 1, cor: COR.cobre, antes: 40 * k }), T(v.titulo, { fam: "serif", peso: pesoT(t), tam: 96 * k, lh: 1.1, cor: t.titulo, equilibrar: true, antes: 44 * k }), Fio(160, t.fio, 60 * k)]; },
        M, W - 2 * M, 520, 1400, "centro", "centro");
      guiaReels(ctx, W, H, o);
    }
  });

  /* Stickers (PNG transparente) ───────────────────────────── */
  var ESTILOS_STICKER = [["petroleo", "Petróleo"], ["noite", "Noite"], ["papel", "Papel"], ["cobre", "Cobre"], ["contorno-claro", "Contorno claro (para fundo escuro)"], ["contorno-escuro", "Contorno escuro (para fundo claro)"]];
  function estiloSticker(e) {
    if (e === "contorno-claro") return { fundo: null, borda: COR.papel, texto: COR.papel, acento: COR.cobre };
    if (e === "contorno-escuro") return { fundo: null, borda: COR.petroleo, texto: COR.petroleo, acento: COR.cobre };
    var t = TEMAS[e] || TEMAS.petroleo;
    return { fundo: t.fundo, borda: null, texto: e === "cobre" ? COR.noite : t.escuro ? COR.papel : COR.petroleo, acento: e === "cobre" ? COR.noite : COR.cobre };
  }
  function caixa(ctx, x, y, w, h, es) {
    if (es.fundo) { ctx.fillStyle = es.fundo; ctx.fillRect(x, y, w, h); }
    if (es.borda) { ctx.strokeStyle = es.borda; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); }
  }
  modelo({
    id: "k-etiqueta", grupo: "stickers", nome: "Etiqueta", desc: "Rótulo curto para chamar atenção no story.", w: 1600, h: 400, transparente: true, aparar: true,
    campos: [["texto", "Texto", "texto", null, ETIQUETAS], ["estilo", "Estilo", "opcoes", ESTILOS_STICKER]],
    padrao: { texto: "DICA", estilo: "petroleo" },
    variantes: [
      { nome: "Dica", valores: { texto: "DICA", estilo: "petroleo" } }, { nome: "Mito ou verdade?", valores: { texto: "MITO OU VERDADE?", estilo: "papel" } },
      { nome: "Link na bio", valores: { texto: "LINK NA BIO", estilo: "cobre" } }, { nome: "Novo post", valores: { texto: "NOVO POST", estilo: "contorno-claro" } }
    ],
    kit: function (v) { return ETIQUETAS.map(function (e) { return { nome: e, v: ext(v, { texto: e }) }; }); },
    kitNome: "BAIXAR TODAS AS ETIQUETAS NESTE ESTILO (.ZIP)",
    desenhar: function (ctx, W, H, v) {
      var es = estiloSticker(v.estilo), tam = 44, txt = String(v.texto || "").toUpperCase();
      fonte(ctx, 600, tam, "sans");
      var w = larguraEsp(ctx, txt, tam * .2) + tam * 2.4, h = tam * 2.6;
      caixa(ctx, (W - w) / 2, (H - h) / 2, w, h, es);
      rotulo(ctx, txt, W / 2, (H - tam) / 2 + 2, { tam: tam, peso: 600, cor: es.texto, esp: .2, alinhar: "centro" });
    }
  });
  modelo({
    id: "k-seta", grupo: "stickers", nome: "Seta", desc: "Para apontar para o link, a enquete ou o próximo story.", w: 900, h: 900, transparente: true, aparar: true,
    campos: [["direcao", "Direção", "opcoes", [["baixo", "Para baixo"], ["direita", "Para a direita"], ["curva", "Curva"], ["cima", "Para cima"]]], ["cor", "Cor", "opcoes", [["papel", "Papel"], ["petroleo", "Petróleo"], ["cobre", "Cobre"], ["noite", "Noite"]]], ["texto", "Texto junto da seta (opcional)", "texto"]],
    padrao: { direcao: "baixo", cor: "cobre", texto: "TOQUE AQUI" },
    desenhar: function (ctx, W, H, v) {
      var cor = COR[v.cor] || COR.cobre;
      if (!vazio(v.texto)) rotulo(ctx, v.texto, W / 2, 130, { tam: 40, peso: 600, cor: cor, esp: .2, alinhar: "centro" });
      ctx.save(); ctx.strokeStyle = cor; ctx.lineWidth = 10; ctx.lineCap = "square"; ctx.lineJoin = "miter"; ctx.beginPath();
      var cx = W / 2;
      if (v.direcao === "direita") { ctx.moveTo(220, 500); ctx.lineTo(680, 500); ctx.moveTo(600, 420); ctx.lineTo(680, 500); ctx.lineTo(600, 580); }
      else if (v.direcao === "cima") { ctx.moveTo(cx, 760); ctx.lineTo(cx, 300); ctx.moveTo(cx - 80, 380); ctx.lineTo(cx, 300); ctx.lineTo(cx + 80, 380); }
      else if (v.direcao === "curva") { ctx.moveTo(260, 300); ctx.quadraticCurveTo(300, 700, 640, 700); ctx.moveTo(570, 630); ctx.lineTo(640, 700); ctx.lineTo(570, 770); }
      else { ctx.moveTo(cx, 260); ctx.lineTo(cx, 760); ctx.moveTo(cx - 80, 680); ctx.lineTo(cx, 760); ctx.lineTo(cx + 80, 680); }
      ctx.stroke(); ctx.restore();
    }
  });
  modelo({
    id: "k-selo", grupo: "stickers", nome: "Selo circular", desc: "Texto em volta do monograma, como um carimbo.", w: 900, h: 900, transparente: true, aparar: true,
    campos: [["texto", "Texto em volta", "texto"], ["centro", "Centro", "opcoes", [["V", "V"], ["VHG", "VHG"]]], ["estilo", "Estilo", "opcoes", [["petroleo", "Petróleo"], ["noite", "Noite"], ["papel", "Papel"], ["contorno-claro", "Sem fundo, claro"], ["contorno-escuro", "Sem fundo, escuro"]]]],
    padrao: { texto: "PLANEJAMENTO FINANCEIRO · BOTUCATU E ONLINE · ", centro: "V", estilo: "petroleo" },
    desenhar: function (ctx, W, H, v) {
      var es = estiloSticker(v.estilo), cx = W / 2, cy = H / 2, R0 = 400;
      if (es.fundo) { ctx.fillStyle = es.fundo; ctx.beginPath(); ctx.arc(cx, cy, R0, 0, Math.PI * 2); ctx.fill(); }
      if (es.borda) { ctx.strokeStyle = es.borda; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R0 - 2, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = es.acento; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 250, 0, Math.PI * 2); ctx.stroke();
      var txt = String(v.texto || "").toUpperCase(), r = 318, tam = 44;
      if (txt) {
        fonte(ctx, 500, tam, "sans");
        while (tam > 18 && larguraEsp(ctx, txt, tam * .12) > 2 * Math.PI * r) { tam -= 2; fonte(ctx, 500, tam, "sans"); }
        var chars = txt.split(""), base = chars.reduce(function (a, c) { return a + ctx.measureText(c).width; }, 0);
        var esp = (2 * Math.PI * r - base) / chars.length, a = -Math.PI / 2;
        ctx.fillStyle = es.texto; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        chars.forEach(function (c) {
          var w = ctx.measureText(c).width + esp, ac = a + w / 2 / r;
          ctx.save(); ctx.translate(cx + r * Math.cos(ac), cy + r * Math.sin(ac)); ctx.rotate(ac + Math.PI / 2); ctx.fillText(c, 0, 0); ctx.restore();
          a += w / r;
        });
      }
      var s = v.centro === "VHG" ? "VHG" : "V", tm = s === "V" ? 300 : 150;
      fonte(ctx, 200, tm, "serif"); ctx.fillStyle = es.texto; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (s === "V") ctx.fillText("V", cx, cy + tm * .05);
      else { ctx.textAlign = "left"; var e2 = tm * .08; espacado(ctx, s, cx - larguraEsp(ctx, s, e2) / 2, cy + tm * .05, e2); }
      ctx.textAlign = "left";
    }
  });
  modelo({
    id: "k-numero", grupo: "stickers", nome: "Número", desc: "Para numerar passos e listas nos stories.", w: 600, h: 600, transparente: true, aparar: true,
    campos: [["numero", "Número", "texto"], ["estilo", "Estilo", "opcoes", ESTILOS_STICKER]],
    padrao: { numero: "01", estilo: "petroleo" },
    kit: function (v) { var l = []; for (var i = 1; i <= 10; i++) l.push({ nome: dois(i), v: ext(v, { numero: dois(i) }) }); return l; },
    kitNome: "BAIXAR DE 01 A 10 (.ZIP)",
    desenhar: function (ctx, W, H, v) {
      var es = estiloSticker(v.estilo), s = 300;
      caixa(ctx, (W - s) / 2, (H - s) / 2, s, s, es);
      fonte(ctx, 200, 180, "serif"); ctx.fillStyle = es.fundo === COR.cobre ? COR.noite : es.fundo && es.texto === COR.papel ? COR.cobre : es.texto;
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(v.numero || "").slice(0, 3), W / 2, H / 2 + 8); ctx.textAlign = "left";
    }
  });
  modelo({
    id: "k-nota", grupo: "stickers", nome: "Nota", desc: "Caixa de texto curto, com a régua de cobre.", w: 1080, h: 1400, transparente: true, aparar: true,
    campos: [["rotulo", "Rótulo (opcional)", "texto"], ["texto", "Texto", "area"], ["estilo", "Fundo", "opcoes", [["papel", "Papel"], ["petroleo", "Petróleo"], ["noite", "Noite"], ["nevoa", "Névoa"]]]],
    padrao: { rotulo: "VOCÊ SABIA?", texto: "A reserva de emergência ideal cobre de 6 a 12 meses do seu custo fixo.", estilo: "papel" },
    desenhar: function (ctx, W, H, v) {
      var t = TEMAS[v.estilo] || TEMAS.papel, w = 860, x = (W - w) / 2, pad = 56;
      var itens = [R(v.rotulo, { tam: 22, cor: t.rotulo }), T(v.texto, { fam: "serif", peso: pesoT(t) + 100, tam: 54, lh: 1.25, cor: t.titulo, antes: 24 })];
      var r = pilha(ctx, itens, x + pad + 10, w - 2 * pad - 10, 0, H, "centro", "esq", true);
      ctx.fillStyle = t.fundo; ctx.fillRect(x, r.y - pad, w, r.h + 2 * pad);
      ctx.fillStyle = COR.cobre; ctx.fillRect(x, r.y - pad, 8, r.h + 2 * pad);
      pilha(ctx, itens, x + pad + 10, w - 2 * pad - 10, 0, H, "centro", "esq");
    }
  });
  modelo({
    id: "k-assinatura", grupo: "stickers", nome: "Assinatura", desc: "Monograma e @ para fechar stories e vídeos.", w: 1080, h: 700, transparente: true, aparar: true,
    campos: [["cor", "Cor", "opcoes", [["claro", "Clara (para fundo escuro)"], ["escuro", "Escura (para fundo claro)"]]], ["linha", "Texto abaixo", "texto"]],
    padrao: { cor: "claro", linha: IG },
    desenhar: function (ctx, W, H, v) {
      var claro = v.cor !== "escuro", cl = claro ? coresLogo(TEMAS.petroleo) : coresLogo(TEMAS.papel);
      var h = logo(ctx, W / 2, 160, 220, cl, true);
      if (!vazio(v.linha)) rotulo(ctx, v.linha, W / 2, 160 + h + 50, { tam: 30, peso: 500, cor: claro ? COR.papel : COR.petroleo, esp: .2, alinhar: "centro" });
    }
  });

  /* Edição de reels ───────────────────────────────────────── */
  var EST_BLOCO = [["petroleo", "Bloco petróleo"], ["noite", "Bloco noite"], ["papel", "Bloco papel"]];
  modelo({
    id: "e-nome", grupo: "edicao", nome: "Legenda de nome", desc: "Nome e função no canto do vídeo (lower third).", w: 1080, h: 1920, transparente: true, guia: true,
    campos: [["nome", "Nome", "texto"], ["cargo", "Função", "texto"], ["posicao", "Posição", "opcoes", [["inferior", "Embaixo"], ["superior", "Em cima"]]], ["estilo", "Estilo", "opcoes", EST_BLOCO]],
    padrao: { nome: "Vitor Hugo Germano", cargo: "PLANEJADOR FINANCEIRO", posicao: "inferior", estilo: "petroleo" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.estilo] || TEMAS.petroleo, M = 72, px = 44, py = 36;
      fonte(ctx, pesoT(t), 60, "serif"); var wn = ctx.measureText(v.nome || "").width;
      fonte(ctx, 500, 22, "sans"); var wc = larguraEsp(ctx, String(v.cargo || "").toUpperCase(), 22 * .22);
      var w = Math.max(wn, wc, 80) + 2 * px, h = 60 * 1.1 + 20 + 2 + 20 + 22 * 1.25 + 2 * py;
      var y = v.posicao === "superior" ? 300 : H - 460 - h;
      ctx.fillStyle = t.fundo; ctx.fillRect(M, y, w, h);
      pilha(ctx, [T(v.nome, { fam: "serif", peso: pesoT(t), tam: 60, lh: 1.1, cor: t.titulo }), Fio(80, t.fio, 20), R(v.cargo, { tam: 22, cor: t.escuro ? t.texto : t.rotulo, antes: 20 })], M + px, w - 2 * px, y + py, y + h - py, "topo", "esq");
      guiaStory(ctx, W, H, o);
    }
  });
  modelo({
    id: "e-capitulo", grupo: "edicao", nome: "Marcador de tópico", desc: "Número e nome do tópico, para dividir o vídeo em partes.", w: 1080, h: 1920, transparente: true, guia: true,
    campos: [["numero", "Número", "texto"], ["texto", "Tópico", "texto"], ["estilo", "Estilo", "opcoes", EST_BLOCO]],
    padrao: { numero: "01", texto: "Quanto guardar", estilo: "petroleo" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.estilo] || TEMAS.petroleo, M = 72, y = 300, h = 150;
      fonte(ctx, 500, 30, "sans"); var wt = larguraEsp(ctx, String(v.texto || "").toUpperCase(), 30 * .2);
      ctx.fillStyle = t.fundo; ctx.fillRect(M, y, 214 + wt + 52, h);
      bloco(ctx, v.numero, M + 36, y + 22, { fam: "serif", peso: 200, tam: 100, lh: 1, cor: COR.cobre });
      ctx.fillStyle = t.linha; ctx.fillRect(M + 182, y + 36, 2, h - 72);
      rotulo(ctx, v.texto, M + 214, y + (h - 30) / 2, { tam: 30, cor: t.titulo, esp: .2 });
      guiaStory(ctx, W, H, o);
    }
  });
  modelo({
    id: "e-numero", grupo: "edicao", nome: "Número na tela", desc: "Um número grande no meio do vídeo, com legenda.", w: 1080, h: 1920, transparente: true, guia: true,
    campos: [["destaque", "Número", "texto"], ["legenda", "Legenda", "area"], ["estilo", "Estilo", "opcoes", [["papel", "Bloco papel"], ["petroleo", "Bloco petróleo"], ["noite", "Bloco noite"]]]],
    padrao: { destaque: "25×", legenda: "o seu gasto anual é uma referência comum para a independência financeira.", estilo: "papel" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.estilo] || TEMAS.papel, M = 110, pad = 60;
      var itens = function (k) { return [T(v.destaque, { fam: "serif", peso: 200, tam: 190 * k, lh: 1, cor: t.escuro ? COR.cobre : COR.petroleo }), Fio(100, COR.cobre, 36), T(v.legenda, { fam: "sans", tam: 36 * k, lh: 1.5, cor: t.titulo, antes: 32 * k })]; };
      var r = pilhaAjustada(ctx, itens, M, W - 2 * M, 640, 1300, "centro", "centro", true);
      ctx.fillStyle = t.fundo; ctx.fillRect(M - pad, r.y - pad, W - 2 * M + 2 * pad, r.h + 2 * pad);
      pilhaAjustada(ctx, itens, M, W - 2 * M, 640, 1300, "centro", "centro");
      guiaStory(ctx, W, H, o);
    }
  });
  modelo({
    id: "e-frase", grupo: "edicao", nome: "Frase na tela", desc: "Caixa com a frase-chave do vídeo, no terço de baixo.", w: 1080, h: 1920, transparente: true, guia: true,
    campos: [["texto", "Frase", "area"], ["estilo", "Estilo", "opcoes", [["papel", "Bloco papel"], ["petroleo", "Bloco petróleo"], ["noite", "Bloco noite"]]]],
    padrao: { texto: "O que não fica na conta não vira gasto.", estilo: "papel" },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.estilo] || TEMAS.papel, w = 900, x = (W - w) / 2, pad = 48;
      var itens = [T(v.texto, { fam: "serif", peso: pesoT(t) + 100, tam: 58, lh: 1.22, cor: t.titulo, equilibrar: true })];
      var r = pilha(ctx, itens, x + pad, w - 2 * pad, 1150, 1450, "base", "centro", true);
      ctx.fillStyle = t.fundo; ctx.fillRect(x, r.y - pad, w, r.h + 2 * pad);
      pilha(ctx, itens, x + pad, w - 2 * pad, 1150, 1450, "base", "centro");
      guiaStory(ctx, W, H, o);
    }
  });
  modelo({
    id: "e-abertura", grupo: "edicao", nome: "Cartela de abertura", desc: "Tela cheia com o título, para os primeiros segundos.", w: 1080, h: 1920, guia: true,
    campos: [["tema", "Fundo", "tema", T_FEED], ["padrao", "Usar o padrão tipográfico ao fundo", "check"], ["rotulo", "Rótulo", "texto"], ["titulo", "Título", "area"]],
    padrao: { tema: "petroleo", padrao: false, rotulo: "PARTE 1", titulo: "Antes de investir, responda três perguntas" },
    desenhar: function (ctx, W, H, v, o) { TPL["r-texto"].desenhar(ctx, W, H, v, {}); guiaStory(ctx, W, H, o); }
  });
  modelo({
    id: "e-encerramento", grupo: "edicao", nome: "Cartela de encerramento", desc: "Logo, chamada e @ para os últimos segundos.", w: 1080, h: 1920, guia: true,
    campos: [["tema", "Fundo", "tema", ["petroleo", "noite", "papel"]], ["chamada", "Chamada", "area"], ["linha1", "Linha 1", "texto"], ["linha2", "Linha 2", "texto"]],
    padrao: { tema: "petroleo", chamada: "Salve para rever e mande para quem precisa ouvir isso.", linha1: "SIGA " + IG.toUpperCase(), linha2: SITE.toUpperCase() },
    desenhar: function (ctx, W, H, v, o) {
      var t = TEMAS[v.tema] || TEMAS.petroleo, M = 120;
      fundo(ctx, W, H, t.fundo);
      var h = logo(ctx, W / 2, 560, 200, coresLogo(t), true);
      pilhaAjustada(ctx, function (k) { return [T(v.chamada, { fam: "serif", peso: 300, it: true, tam: 60 * k, lh: 1.25, cor: t.titulo, equilibrar: true })]; }, M, W - 2 * M, 560 + h + 110, 1300, "topo", "centro");
      rotulo(ctx, v.linha1, W / 2, 1380, { tam: 26, cor: t.rotulo, esp: .22, alinhar: "centro" });
      rotulo(ctx, v.linha2, W / 2, 1430, { tam: 20, peso: 400, cor: t.suave, esp: .22, alinhar: "centro" });
      guiaStory(ctx, W, H, o);
    }
  });
  modelo({
    id: "e-marca", grupo: "edicao", nome: "Marca d'água", desc: "Monograma discreto no canto, para o vídeo inteiro.", w: 1080, h: 1920, transparente: true, guia: true,
    campos: [["versao", "Versão", "opcoes", [["VHG", "VHG"], ["V", "V"]]], ["canto", "Canto", "opcoes", [["sup-dir", "Em cima, à direita"], ["sup-esq", "Em cima, à esquerda"], ["inf-dir", "Embaixo, à direita"], ["inf-esq", "Embaixo, à esquerda"]]], ["cor", "Cor", "opcoes", [["papel", "Clara"], ["noite", "Escura"]]], ["opacidade", "Opacidade (%)", "faixa", [20, 100]]],
    padrao: { versao: "VHG", canto: "sup-dir", cor: "papel", opacidade: 70 },
    desenhar: function (ctx, W, H, v, o) {
      var dir = /dir/.test(v.canto), cima = /sup/.test(v.canto), tam = v.versao === "V" ? 90 : 64, M = 72;
      ctx.save(); ctx.globalAlpha = (v.opacidade || 70) / 100;
      monograma(ctx, dir ? W - M : M, cima ? 270 : H - 380 - tam, tam, COR[v.cor] || COR.papel, 200, dir ? "dir" : "esq", v.versao === "V" ? "V" : "VHG");
      ctx.restore();
      guiaStory(ctx, W, H, o);
    }
  });
  modelo({
    id: "e-guia", grupo: "edicao", nome: "Guia de área segura", desc: "Camada de referência para editar. Apague antes de exportar o vídeo.", w: 1080, h: 1920, transparente: true,
    campos: [],
    padrao: {},
    desenhar: function (ctx, W, H) {
      guiaStory(ctx, W, H, { guia: true });
      tracejado(ctx, function () { ctx.moveTo(W - 160, 250); ctx.lineTo(W - 160, H - 340); ctx.moveTo(72, 250); ctx.lineTo(72, H - 340); ctx.moveTo(W - 72, 250); ctx.lineTo(W - 72, 1000); });
      ctx.save(); ctx.translate(W - 128, H / 2 + 300); ctx.rotate(-Math.PI / 2);
      rotulo(ctx, "BOTÕES DO REELS", 0, 0, { tam: 18, cor: COR_GUIA, alinhar: "centro" }); ctx.restore();
      ctx.save(); ctx.strokeStyle = COR_GUIA; ctx.lineWidth = 2; ctx.strokeRect((W - 1080) / 2 + 2, (H - 1440) / 2, 1076, 1440); ctx.restore();
      rotulo(ctx, "RECORTE 3:4 DA GRADE", W / 2, (H - 1440) / 2 + 16, { tam: 18, cor: COR_GUIA, alinhar: "centro" });
    }
  });

  /* ── Desenho, exportação e arquivos ──────────────────────── */
  function tamanho(tpl, v) { return tpl.dims ? tpl.dims(v) : dims(tpl, v); }
  function desenharEm(cv, tpl, v, escala, o) {
    var d = tamanho(tpl, v), ctx = cv.getContext("2d");
    var w = Math.round(d[0] * escala), h = Math.round(d[1] * escala);
    if (cv.width !== w) cv.width = w;
    if (cv.height !== h) cv.height = h;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    try { tpl.desenhar(ctx, d[0], d[1], v, o || {}); } catch (e) { console.error(e); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return cv;
  }
  function aparar(cv, pad) {
    var ctx = cv.getContext("2d"), d = ctx.getImageData(0, 0, cv.width, cv.height).data, x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (var y = 0; y < cv.height; y++) for (var x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return cv;
    pad = pad || 16;
    var n = document.createElement("canvas");
    n.width = x1 - x0 + 1 + 2 * pad; n.height = y1 - y0 + 1 + 2 * pad;
    n.getContext("2d").drawImage(cv, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1);
    return n;
  }
  function arquivoFinal(tpl, v, slide) {
    var cv = desenharEm(document.createElement("canvas"), tpl, v, 1, { slide: slide });
    var transparente = tpl.transparente || (tpl.id === "logo" && /transp/.test(v.fundo));
    return tpl.aparar && transparente ? aparar(cv, 24) : cv;
  }
  function blob(cv) { return new Promise(function (ok) { cv.toBlob(ok, "image/png"); }); }
  function baixarBlob(b, nome) {
    var a = document.createElement("a"), u = URL.createObjectURL(b);
    a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  async function baixarVarios(lista, nomeZip) {
    if (window.JSZip) {
      var zip = new window.JSZip();
      for (var i = 0; i < lista.length; i++) zip.file(lista[i].nome, await blob(lista[i].cv));
      baixarBlob(await zip.generateAsync({ type: "blob" }), nomeZip);
      return;
    }
    for (var j = 0; j < lista.length; j++) { baixarBlob(await blob(lista[j].cv), lista[j].nome); await new Promise(function (ok) { setTimeout(ok, 450); }); }
  }
  function nomeArquivo(tpl, v, extra) { return "vhg-" + slug(tpl.nome) + (extra ? "-" + slug(extra) : "") + ".png"; }

  /* ── Modelos salvos (neste navegador) ────────────────────── */
  function lerSalvos() { try { return JSON.parse(localStorage.getItem(CHAVE_SALVOS) || "[]"); } catch (e) { return []; } }
  function gravarSalvos(l) { try { localStorage.setItem(CHAVE_SALVOS, JSON.stringify(l)); return true; } catch (e) { return false; } }

  /* ── Interface ───────────────────────────────────────────── */
  var raiz, grupoAtual = "identidade", ed = null, mostrarGuia = true;

  function chips() {
    return '<div class="est-secoes" role="tablist">' + GRUPOS.map(function (g) {
      var n = g[0] === "salvos" ? lerSalvos().length : 0;
      return '<button type="button" data-grupo="' + g[0] + '" class="' + (g[0] === grupoAtual ? "on" : "") + '">' + g[1] + (n ? ' <span class="cont">' + n + "</span>" : "") + "</button>";
    }).join("") + "</div>";
  }
  function itensDoGrupo(g) {
    if (g === "salvos") return lerSalvos().map(function (s) { return { tpl: TPL[s.tpl], nome: s.nome, desc: "Salvo em " + new Date(s.em).toLocaleDateString("pt-BR"), valores: s.valores, salvo: s.id }; }).filter(function (i) { return i.tpl; });
    var out = [];
    ORDEM.filter(function (t) { return t.grupo === g; }).forEach(function (t) {
      if (t.variantes) t.variantes.forEach(function (va) { out.push({ tpl: t, nome: va.nome, desc: va.desc || t.desc, valores: ext(clone(t.padrao), va.valores ? clone(va.valores) : {}) }); });
      else out.push({ tpl: t, nome: t.nome, desc: t.desc, valores: clone(t.padrao) });
    });
    return out;
  }
  /* Arquivos oficiais da entrega de identidade visual (assets/marca/) */
  var ARQUIVOS = [
    ["Logo", "logo/", [["vhg-logo-principal-fundo-petroleo.png", "Principal · fundo petróleo"], ["vhg-logo-principal-fundo-papel.png", "Principal · fundo papel"],
      ["vhg-logo-principal-transparente-negativo.png", "Transparente · negativo", "escuro"], ["vhg-logo-principal-transparente-positivo.png", "Transparente · positivo"],
      ["vhg-logo-monocromatico-branco.png", "Monocromático branco", "escuro"], ["vhg-logo-monocromatico-preto.png", "Monocromático preto"],
      ["vhg-logo-reduzido-petroleo.png", "Reduzido · petróleo"], ["vhg-logo-reduzido-monocromatico-preto.png", "Reduzido · preto"],
      ["vhg-icone-512.png", "Ícone 512"], ["vhg-favicon-v-512.png", "Favicon V 512"]]],
    ["Foto de perfil", "avatar/", [["avatar-retrato-1080.png", "Retrato (Instagram)"], ["avatar-vhg-petroleo-1080.png", "Monograma · petróleo"], ["avatar-vhg-papel-1080.png", "Monograma · papel"]]],
    ["Bases e elementos para o Canva", "canva/", [["base-post-petroleo-1080.png", "Base de post · petróleo"], ["base-post-papel-1080.png", "Base de post · papel"],
      ["base-story-petroleo-1080x1920.png", "Base de story · petróleo"], ["base-story-papel-1080x1920.png", "Base de story · papel"],
      ["fundo-padrao-petroleo-1080.png", "Fundo com padrão · petróleo"], ["fundo-padrao-papel-1080.png", "Fundo com padrão · papel"],
      ["assinatura-post-clara.png", "Assinatura de post · clara", "escuro"], ["assinatura-post-escura.png", "Assinatura de post · escura"], ["regua-cobre.png", "Régua cobre"]]],
    ["Posts de exemplo", "instagram/", [["post-01-capa-carrossel.png", "Capa de carrossel"], ["post-02-convite.png", "Convite"], ["post-03-apresentacao.png", "Apresentação"]]],
    ["Capas de outras redes", "capas/", [["capa-youtube-petroleo-2560x1440.png", "YouTube · petróleo"], ["capa-youtube-retrato-2560x1440.png", "YouTube · retrato"], ["capa-youtube-modelo-2560x1440.png", "YouTube · modelo"],
      ["capa-linkedin-petroleo-1584x396.png", "LinkedIn · petróleo"], ["capa-linkedin-retrato-1584x396.png", "LinkedIn · retrato"], ["capa-facebook-1640x624.png", "Facebook"]]],
    ["Assinatura de e-mail", "assinatura/", [["assinatura-completa.png", "Completa"], ["assinatura-curta.png", "Curta"], ["icone-assinatura-152.png", "Ícone"]]]
  ];
  var FONTES = ["Newsreader72pt-ExtraLight.ttf", "Newsreader72pt-Light.ttf", "Newsreader72pt-LightItalic.ttf", "Newsreader16pt-Light.ttf", "Newsreader16pt-Regular.ttf", "Newsreader16pt-Italic.ttf",
    "Archivo-Regular.ttf", "Archivo-Medium.ttf", "Archivo-SemiBold.ttf", "OFL-Newsreader.txt", "OFL-Archivo.txt"];
  function painelArquivos() {
    return '<div class="est-arquivos-topo"><div class="eyebrow" style="margin:0">ARQUIVOS OFICIAIS DA MARCA</div>' +
      '<button type="button" class="btn btn-petroleo" data-zip-marca>BAIXAR TUDO (.ZIP)</button></div>' +
      ARQUIVOS.map(function (g) {
        return '<div class="est-arq-grupo"><div class="tit">' + esc(g[0]) + '</div><div class="est-arquivos">' + g[2].map(function (a) {
          return '<a class="est-arq" href="' + MARCA + g[1] + a[0] + '" download><span class="img' + (a[2] ? " escuro" : " xadrez") + '"><img src="' + MARCA + g[1] + a[0] + '" alt="" loading="lazy"></span><span class="nome">' + esc(a[1]) + "</span></a>";
        }).join("") + "</div></div>";
      }).join("") +
      '<div class="est-arq-grupo"><div class="tit">Fontes (licença livre, inclusive para uso comercial)</div><div class="est-fontes-lista">' +
      FONTES.map(function (f) { return '<a class="acao-tabela" href="' + MARCA + "fontes/" + f + '" download>' + esc(f.replace(/\.(ttf|txt)$/, "")) + "</a>"; }).join("") + "</div></div>";
  }
  async function zipMarca(bt) {
    if (!window.JSZip) { alert("Não foi possível preparar o .zip agora. Baixe os arquivos um a um."); return; }
    bt.disabled = true; var txt = bt.textContent; bt.textContent = "PREPARANDO…";
    try {
      var zip = new window.JSZip(), lista = [];
      ARQUIVOS.forEach(function (g) { g[2].forEach(function (a) { lista.push([g[1] + a[0], g[0] + "/" + a[0]]); }); });
      FONTES.forEach(function (f) { lista.push(["fontes/" + f, "Fontes/" + f]); });
      lista.push(["LEIA-ME.txt", "LEIA-ME.txt"]);
      await Promise.all(lista.map(function (l) { return fetch(MARCA + l[0]).then(function (r) { if (!r.ok) throw new Error(l[0]); return r.blob(); }).then(function (b) { zip.file(l[1], b); }); }));
      baixarBlob(await zip.generateAsync({ type: "blob" }), "identidade-visual-vhg.zip");
    } catch (e) { console.error(e); alert("Não foi possível preparar o .zip: " + e.message); }
    finally { bt.disabled = false; bt.textContent = txt; }
  }
  function painelIdentidade() {
    var cores = [["Azul petróleo", "#123B47", "Blocos sólidos: capa, rodapé, um post inteiro."], ["Noite", "#0B2530", "Texto principal e fundos mais fechados."], ["Cobre", "#C08A4E", "Só traço, número ou rótulo. Nunca área grande."], ["Névoa", "#DCE3E2", "Separa caixas e tabelas."], ["Papel", "#F2EDE4", "Mais da metade de qualquer peça."]];
    var apoio = [["Tinta", "#48534F", "corpo de texto"], ["Pedra", "#8A8175", "rótulos"], ["Linha", "#DCD4C6", "filetes"], ["Superfície", "#FBF9F5", "página"]];
    var regras = [
      ["Tom de voz", "Direto e sem jargão. Frases curtas, números explicados. Nada de promessa de rentabilidade, emoji ou caixa alta como ênfase."],
      ["Margem e texto", "72 px de margem no post. Título com até 12 palavras, no mínimo 40 px. Uma ideia por post; o resto vai na legenda."],
      ["Ritmo no feed", "Alterne fundo petróleo e papel entre publicações. Evite três posts escuros seguidos."],
      ["Fotografia", "Luz natural, fundo neutro, enquadramento calmo. Sem filtro colorido e sem foto de banco com gráfico de bolsa."],
      ["Ornamento", "A régua fina de cobre é o único enfeite, além do padrão VHG. Espessura nunca maior que 2 px."],
      ["Aviso legal", "Peça que cita produto ou desempenho leva o aviso legal em letra pequena no pé."]
    ];
    function sw(c, grande) {
      var claro = /F2EDE4|DCE3E2|FBF9F5|DCD4C6/.test(c[1]);
      return '<button type="button" class="est-cor' + (grande ? "" : " apoio") + '" data-copiar="' + c[1] + '" title="Copiar ' + c[1] + '">' +
        '<span class="amostra" style="background:' + c[1] + (claro ? "; box-shadow: inset 0 0 0 1px #DCD4C6" : "") + '"></span>' +
        '<span class="nome">' + esc(c[0]) + '</span><span class="hex">' + c[1] + "</span>" + (c[2] ? '<span class="uso">' + esc(c[2]) + "</span>" : "") + "</button>";
    }
    return '<div class="est-identidade">' + painelArquivos() +
      '<div class="eyebrow" style="margin-top:40px">PALETA · TOQUE PARA COPIAR O CÓDIGO</div><div class="est-paleta">' + cores.map(function (c) { return sw(c, true); }).join("") + "</div>" +
      '<div class="est-paleta apoio">' + apoio.map(function (c) { return sw(c, false); }).join("") + "</div>" +
      '<div class="eyebrow" style="margin-top:36px">TIPOGRAFIA</div><div class="est-fontes">' +
      '<div class="card"><div class="amostra-fonte serif">Newsreader</div><p>Títulos, aberturas, números grandes e frases. Pesos 200, 300 e 400. Itálico só em citação e fechamento.</p><a class="acao-tabela" href="https://fonts.google.com/specimen/Newsreader" target="_blank" rel="noopener">BAIXAR NO GOOGLE FONTS</a></div>' +
      '<div class="card"><div class="amostra-fonte sans">Archivo</div><p>Rótulos, legendas, botões e todo texto em caixa alta com espaçamento largo. Pesos 400, 500 e 600.</p><a class="acao-tabela" href="https://fonts.google.com/specimen/Archivo" target="_blank" rel="noopener">BAIXAR NO GOOGLE FONTS</a></div>' +
      "</div>" +
      '<p class="texto-apoio est-nota">Para editar no Canva, Edits ou CapCut: instale as duas fontes (estão nos arquivos oficiais acima; no Canva, envie para o Kit de Marca) e use os códigos de cor. Se o app não aceitar fontes próprias, use as peças prontas desta aba como imagem.</p>' +
      '<div class="eyebrow" style="margin-top:36px">REGRAS RÁPIDAS</div><div class="est-regras">' +
      regras.map(function (r) { return '<div><div class="tit">' + esc(r[0]) + "</div><p>" + esc(r[1]) + "</p></div>"; }).join("") + "</div>" +
      '<div class="eyebrow" style="margin-top:40px">FUNDO COM PADRÃO, EM QUALQUER FORMATO</div></div>';
  }
  function galeria() {
    if (observador) { observador.disconnect(); observador = null; }
    var g = grupoAtual, itens = itensDoGrupo(g);
    var h = chips() + '<p class="texto-apoio est-intro">' + esc(INTRO[g]) + "</p>";
    if (g === "identidade") h += painelIdentidade();
    if (g === "carrossel") h += '<details class="est-pautas"><summary>IDEIAS DE PAUTA</summary><ul>' + PAUTAS.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul></details>";
    if (!itens.length) h += '<div class="vazio-tab">Nenhum modelo salvo ainda. Abra um modelo, edite e toque em <b>Salvar em meus modelos</b>.</div>';
    h += '<div class="est-grade">' + itens.map(function (it, i) {
      return '<div class="est-card"><button type="button" class="abrir" data-item="' + i + '"><div class="mini' + (it.tpl.transparente ? " xadrez" : "") + '"></div>' +
        '<div class="nome">' + esc(it.nome) + '</div><div class="desc">' + esc(it.desc || "") + "</div></button>" +
        (it.salvo ? '<button type="button" class="link-discreto est-apagar" data-apagar="' + it.salvo + '">Apagar</button>' : "") + "</div>";
    }).join("") + "</div>";
    raiz.innerHTML = h;
    ligarChips();
    raiz.querySelectorAll("[data-copiar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var hex = b.dataset.copiar;
        (navigator.clipboard ? navigator.clipboard.writeText(hex) : Promise.reject()).then(function () {
          var el = b.querySelector(".hex"); el.textContent = "COPIADO"; setTimeout(function () { el.textContent = hex; }, 1200);
        }, function () { prompt("Código da cor:", hex); });
      });
    });
    var zb = raiz.querySelector("[data-zip-marca]");
    if (zb) zb.addEventListener("click", function () { zipMarca(zb); });
    raiz.querySelectorAll("[data-apagar]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!confirm("Apagar este modelo salvo?")) return;
        gravarSalvos(lerSalvos().filter(function (s) { return String(s.id) !== b.dataset.apagar; }));
        galeria();
      });
    });
    var minis = raiz.querySelectorAll(".est-card .mini");
    itens.forEach(function (it, i) {
      raiz.querySelector('[data-item="' + i + '"]').addEventListener("click", function () { abrirEditor(it.tpl, it.valores, it.nome, it.salvo); });
      var d = tamanho(it.tpl, it.valores), cv = document.createElement("canvas");
      desenharEm(cv, it.tpl, it.valores, 420 / Math.max(d[0], d[1]), {});
      minis[i].appendChild(cv);
    });
    aoCarregarImagem = function () { if (!ed) galeria(); };
  }
  function ligarChips() {
    raiz.querySelectorAll("[data-grupo]").forEach(function (b) {
      b.addEventListener("click", function () { grupoAtual = b.dataset.grupo; ed = null; galeria(); });
    });
  }

  /* Editor */
  function campoHTML(c, valor, pref) {
    var k = pref + c[0], rot = c[1], tipo = c[2], op = c[3], lista = c[4];
    if (tipo === "check") return '<label class="est-check"><input type="checkbox" name="' + k + '"' + (valor ? " checked" : "") + "><span>" + esc(rot) + "</span></label>";
    var campo;
    if (tipo === "area") campo = '<textarea class="input" rows="3" name="' + k + '">' + esc(valor) + "</textarea>";
    else if (tipo === "opcoes" || tipo === "tema") {
      var ops = tipo === "tema" ? op.map(function (x) { return [x, TEMAS[x].nome]; }) : op;
      campo = '<select class="input" name="' + k + '">' + ops.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === valor ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
    } else if (tipo === "faixa") campo = '<input type="range" name="' + k + '" min="' + op[0] + '" max="' + op[1] + '" value="' + esc(valor) + '">';
    else if (tipo === "foto") campo = '<div class="est-foto"><label class="btn btn-linha">ENVIAR FOTO<input type="file" accept="image/*" name="' + k + '" hidden></label>' +
      '<button type="button" class="link-discreto" data-retrato="' + k + '">Usar o retrato do Vitor</button></div>';
    else campo = '<input class="input" type="text" name="' + k + '" value="' + esc(valor) + '"' + (lista ? ' list="dl-' + k.replace(/\W/g, "") + '"' : "") + ">" +
      (lista ? '<datalist id="dl-' + k.replace(/\W/g, "") + '">' + lista.map(function (l) { return '<option value="' + esc(l) + '">'; }).join("") + "</datalist>" : "");
    return '<label class="campo"><span>' + esc(rot) + "</span>" + campo + "</label>";
  }
  function abrirEditor(tpl, valores, nome, salvoId) {
    ed = { tpl: tpl, v: clone(valores), nome: nome, salvo: salvoId || null, slide: 0 };
    var b = [];
    if (tpl.carrossel) b.push('<button type="button" class="btn btn-petroleo" data-acao="zip">BAIXAR TODOS OS SLIDES (.ZIP)</button><button type="button" class="btn btn-linha" data-acao="png">BAIXAR ESTE SLIDE</button>');
    else b.push('<button type="button" class="btn btn-petroleo" data-acao="png">BAIXAR PNG</button>');
    if (tpl.kit) b.push('<button type="button" class="btn btn-linha" data-acao="kit">' + esc(tpl.kitNome) + "</button>");
    if (navigator.canShare) b.push('<button type="button" class="btn btn-linha" data-acao="compartilhar">COMPARTILHAR</button>');
    b.push('<button type="button" class="btn btn-linha" data-acao="salvar">' + (salvoId ? "ATUALIZAR MODELO SALVO" : "SALVAR EM MEUS MODELOS") + "</button>");
    raiz.innerHTML = chips() +
      '<div class="est-topo-ed"><button type="button" class="acao-tabela" data-voltar>← VOLTAR AOS MODELOS</button></div>' +
      '<div class="est-ed">' +
        '<div class="est-previa"><div class="est-tela' + (tpl.transparente ? " xadrez" : "") + '" id="est-tela"><canvas id="est-canvas"></canvas></div>' +
          '<button type="button" class="est-mini' + (tpl.transparente ? " xadrez" : "") + '" id="est-mini" aria-label="Voltar para a prévia" hidden><canvas></canvas></button>' +
          (tpl.carrossel ? '<div class="est-tira" id="est-tira"></div><div class="est-slide-acoes">' +
            '<select class="input" id="est-novo-tipo" aria-label="Tipo do novo slide">' + Object.keys(TIPOS_SLIDE).map(function (k) { return '<option value="' + k + '">' + TIPOS_SLIDE[k][0] + "</option>"; }).join("") + "</select>" +
            '<button type="button" class="acao-tabela" data-slide="add">+ SLIDE</button><button type="button" class="acao-tabela" data-slide="dup">DUPLICAR</button>' +
            '<button type="button" class="acao-tabela" data-slide="esq">← MOVER</button><button type="button" class="acao-tabela" data-slide="dir">MOVER →</button>' +
            '<button type="button" class="acao-tabela" data-slide="del">APAGAR</button></div>' : "") +
          (tpl.guia ? '<label class="est-check"><input type="checkbox" id="est-guia"' + (mostrarGuia ? " checked" : "") + "><span>Mostrar áreas seguras e espaços dos stickers (não saem no arquivo)</span></label>" : "") +
          '<div class="est-medida" id="est-medida"></div>' +
        "</div>" +
        '<div class="est-lado"><div class="eyebrow cobre">' + esc(GRUPOS.filter(function (g) { return g[0] === tpl.grupo; })[0][1]) + "</div>" +
          '<h2 class="est-titulo">' + esc(nome || tpl.nome) + "</h2>" +
          '<form class="est-campos" id="est-campos" onsubmit="return false"></form>' +
          '<div class="est-acoes">' + b.join("") + "</div>" +
          '<div class="est-status" id="est-status" role="status"></div>' +
          (tpl.dicas ? '<p class="texto-apoio est-nota">' + esc(tpl.dicas) + "</p>" : "") +
        "</div>" +
      "</div>";
    ligarChips();
    raiz.querySelector("[data-voltar]").addEventListener("click", function () { ed = null; galeria(); });
    var g = document.getElementById("est-guia");
    if (g) g.addEventListener("change", function () { mostrarGuia = g.checked; redesenhar(); });
    raiz.querySelectorAll("[data-acao]").forEach(function (bt) { bt.addEventListener("click", function () { acao(bt.dataset.acao, bt); }); });
    raiz.querySelectorAll("[data-slide]").forEach(function (bt) { bt.addEventListener("click", function () { acaoSlide(bt.dataset.slide); }); });
    var form = document.getElementById("est-campos");
    form.addEventListener("input", aoEditar);
    form.addEventListener("change", aoEditar);
    form.addEventListener("click", function (e) {
      var r = e.target.closest("[data-retrato]");
      if (r) { definir(r.dataset.retrato, RETRATO); redesenhar(); }
    });
    aoCarregarImagem = function () { if (ed) redesenhar(); };
    ligarMini();
    montarCampos();
    redesenhar();
    raiz.scrollIntoView({ block: "start", behavior: "smooth" });
  }
  /* No celular, uma prévia pequena fica no canto enquanto a grande está fora da tela. */
  var observador = null;
  function ligarMini() {
    var mini = document.getElementById("est-mini"), tela = document.getElementById("est-tela");
    if (observador) observador.disconnect();
    if (!window.IntersectionObserver) return;
    observador = new IntersectionObserver(function (e) {
      mini.hidden = e[0].isIntersecting || !matchMedia("(max-width: 860px)").matches;
      if (!mini.hidden) copiarMini();
    }, { threshold: .15 });
    observador.observe(tela);
    mini.addEventListener("click", function () { tela.scrollIntoView({ block: "start", behavior: "smooth" }); });
  }
  function copiarMini() {
    var mini = document.getElementById("est-mini"), cv = document.getElementById("est-canvas");
    if (!mini || mini.hidden || !cv) return;
    var m = mini.querySelector("canvas"), s = 260 / Math.max(cv.width, cv.height);
    m.width = Math.round(cv.width * s); m.height = Math.round(cv.height * s);
    m.getContext("2d").drawImage(cv, 0, 0, m.width, m.height);
  }
  function montarCampos() {
    var tpl = ed.tpl, h = tpl.campos.map(function (c) { return campoHTML(c, ed.v[c[0]], "g:"); }).join("");
    if (tpl.carrossel) {
      var s = ed.v.slides[ed.slide], tipo = TIPOS_SLIDE[s.tipo];
      h += '<div class="est-sep">SLIDE ' + dois(ed.slide + 1) + " DE " + dois(ed.v.slides.length) + "</div>" +
        campoHTML(["tipo", "Tipo do slide", "opcoes", Object.keys(TIPOS_SLIDE).map(function (k) { return [k, TIPOS_SLIDE[k][0]]; })], s.tipo, "s:") +
        campoHTML(["tema", "Fundo do slide", "tema", T_FEED], s.tema, "s:") +
        tipo[1].map(function (c) { return campoHTML(c, s[c[0]], "s:"); }).join("");
    }
    document.getElementById("est-campos").innerHTML = h;
  }
  function definir(nome, valor) {
    var p = nome.split(":"), alvo = p[0] === "s" ? ed.v.slides[ed.slide] : ed.v;
    alvo[p[1]] = valor;
    return p;
  }
  function aoEditar(e) {
    var el = e.target;
    if (!el.name || !ed) return;
    if (el.type === "file") {
      if (e.type !== "change" || !el.files[0]) return;
      lerFoto(el.files[0]).then(function (url) { definir(el.name, url); redesenhar(); });
      return;
    }
    var p = definir(el.name, el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value);
    if (p[0] === "s" && p[1] === "tipo" && e.type === "change") {
      var s = ed.v.slides[ed.slide], novo = SLIDE_NOVO[s.tipo];
      Object.keys(novo).forEach(function (k) { if (s[k] == null) s[k] = novo[k]; });
      montarCampos();
    }
    redesenhar();
  }
  function lerFoto(arq) {
    return new Promise(function (ok) {
      var r = new FileReader();
      r.onload = function () {
        var i = new Image();
        i.onload = function () {
          var s = Math.min(1, 1600 / Math.max(i.naturalWidth, i.naturalHeight)), cv = document.createElement("canvas");
          cv.width = Math.round(i.naturalWidth * s); cv.height = Math.round(i.naturalHeight * s);
          cv.getContext("2d").drawImage(i, 0, 0, cv.width, cv.height);
          var url = cv.toDataURL("image/jpeg", .88);
          esperarImagem(url).then(function () { ok(url); });
        };
        i.src = r.result;
      };
      r.readAsDataURL(arq);
    });
  }
  var pedido = 0;
  function redesenhar() {
    cancelAnimationFrame(pedido);
    pedido = requestAnimationFrame(function () {
      if (!ed) return;
      var cv = document.getElementById("est-canvas");
      if (!cv) return;
      desenharEm(cv, ed.tpl, ed.v, 1, { guia: mostrarGuia && ed.tpl.guia, slide: ed.slide });
      var d = tamanho(ed.tpl, ed.v);
      document.getElementById("est-medida").textContent = d[0] + " × " + d[1] + " px · PNG" + (ed.tpl.transparente ? " com fundo transparente" + (ed.tpl.aparar ? ", recortado no tamanho do desenho" : "") : "");
      if (ed.tpl.carrossel) tira();
      copiarMini();
    });
  }
  function tira() {
    var el = document.getElementById("est-tira"), n = ed.v.slides.length;
    if (el.children.length !== n) {
      el.innerHTML = ed.v.slides.map(function (s, i) { return '<button type="button" data-ir="' + i + '" aria-label="Slide ' + (i + 1) + '"><canvas></canvas><span>' + dois(i + 1) + "</span></button>"; }).join("");
      el.querySelectorAll("[data-ir]").forEach(function (b) { b.addEventListener("click", function () { ed.slide = Number(b.dataset.ir); montarCampos(); redesenhar(); }); });
    }
    el.querySelectorAll("[data-ir]").forEach(function (b, i) {
      b.classList.toggle("on", i === ed.slide);
      desenharEm(b.querySelector("canvas"), ed.tpl, ed.v, .12, { slide: i });
    });
  }
  function acaoSlide(a) {
    var l = ed.v.slides, i = ed.slide;
    if (a === "add") { var tipo = document.getElementById("est-novo-tipo").value; l.splice(i + 1, 0, slide(tipo, l[i] ? l[i].tema : "papel")); ed.slide = i + 1; }
    else if (a === "dup") { l.splice(i + 1, 0, clone(l[i])); ed.slide = i + 1; }
    else if (a === "esq" && i > 0) { l.splice(i - 1, 0, l.splice(i, 1)[0]); ed.slide = i - 1; }
    else if (a === "dir" && i < l.length - 1) { l.splice(i + 1, 0, l.splice(i, 1)[0]); ed.slide = i + 1; }
    else if (a === "del") {
      if (l.length < 2) return status("O carrossel precisa de pelo menos um slide.");
      l.splice(i, 1); ed.slide = Math.min(i, l.length - 1);
    }
    document.getElementById("est-tira").innerHTML = "";
    montarCampos(); redesenhar();
  }
  function status(msg) { var s = document.getElementById("est-status"); if (s) s.textContent = msg || ""; }
  async function acao(a, bt) {
    var tpl = ed.tpl, v = ed.v, nome = ed.nome || tpl.nome;
    bt.disabled = true;
    try {
      if (a === "png") {
        var cv = arquivoFinal(tpl, v, ed.slide);
        baixarBlob(await blob(cv), nomeArquivo(tpl, v, tpl.carrossel ? dois(ed.slide + 1) : (tpl.variantes ? nome : "")));
        status("PNG baixado (" + cv.width + " × " + cv.height + " px).");
      } else if (a === "zip") {
        status("Preparando os slides…");
        await baixarVarios(v.slides.map(function (s, i) { return { nome: dois(i + 1) + ".png", cv: arquivoFinal(tpl, v, i) }; }), "vhg-" + slug(v.rotulo || nome) + "-carrossel.zip");
        status(v.slides.length + " slides baixados. No Instagram, selecione as imagens na ordem dos números.");
      } else if (a === "kit") {
        status("Preparando o kit…");
        var lista = tpl.kit(v);
        await baixarVarios(lista.map(function (k) { return { nome: nomeArquivo(tpl, k.v, k.nome), cv: arquivoFinal(tpl, k.v, 0) }; }), "vhg-" + slug(tpl.nome) + "-kit.zip");
        status(lista.length + " arquivos baixados.");
      } else if (a === "compartilhar") {
        var arquivos = [];
        if (tpl.carrossel) for (var i = 0; i < v.slides.length; i++) arquivos.push(new File([await blob(arquivoFinal(tpl, v, i))], dois(i + 1) + ".png", { type: "image/png" }));
        else arquivos.push(new File([await blob(arquivoFinal(tpl, v, 0))], nomeArquivo(tpl, v), { type: "image/png" }));
        if (!navigator.canShare({ files: arquivos })) { status("Este navegador não permite compartilhar imagens. Use o botão de baixar."); }
        else await navigator.share({ files: arquivos });
      } else if (a === "salvar") {
        var titulo = prompt("Nome para este modelo:", nome);
        if (titulo === null) return;
        var l = lerSalvos(), reg = { id: ed.salvo || Date.now(), tpl: tpl.id, nome: titulo.trim() || nome, valores: v, em: Date.now() };
        l = l.filter(function (s) { return s.id !== reg.id; }); l.unshift(reg);
        if (!gravarSalvos(l)) {
          var semFoto = clone(v); Object.keys(semFoto).forEach(function (k) { if (/^data:/.test(semFoto[k])) semFoto[k] = RETRATO; });
          reg.valores = semFoto; l[0] = reg;
          if (!gravarSalvos(l)) return status("Não foi possível salvar: o espaço deste navegador acabou. Apague modelos antigos em Meus modelos.");
          status("Salvo, mas sem a foto enviada (ela é grande demais para guardar no navegador).");
        } else status("Salvo em Meus modelos.");
        ed.salvo = reg.id; ed.nome = reg.nome;
        bt.textContent = "ATUALIZAR MODELO SALVO";
        var cont = raiz.querySelector('[data-grupo="salvos"]');
        if (cont) cont.innerHTML = "MEUS MODELOS <span class=\"cont\">" + l.length + "</span>";
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
      console.error(e); status("Algo deu errado: " + (e && e.message || e));
    } finally { bt.disabled = false; }
  }

  async function montar(el) {
    raiz = el;
    raiz.innerHTML = '<div class="carregando">CARREGANDO O ESTÚDIO…</div>';
    var fontes = ["200 40px Newsreader", "300 40px Newsreader", "400 40px Newsreader", "italic 300 40px Newsreader", "400 20px Archivo", "500 20px Archivo", "600 20px Archivo"];
    try { await Promise.all(fontes.map(function (f) { return document.fonts.load(f); })); } catch (e) { console.warn(e); }
    await esperarImagem(RETRATO);
    galeria();
  }

  return { montar: montar, _modelos: TPL };
})();
