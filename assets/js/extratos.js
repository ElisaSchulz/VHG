// ─────────────────────────────────────────────────────────────
//  extratos.js — aba "Extratos" do painel do admin
//
//  O Vitor envia faturas de cartão e extratos de conta (PDF,
//  OFX ou CSV), confere a análise e baixa PDF, Excel e .txt.
//
//  PRIVACIDADE: o arquivo é lido aqui, no navegador. Nada é
//  enviado ao Supabase nem a servidor algum, e nada fica salvo:
//  ao fechar a aba ou clicar em "Limpar tudo", tudo some.
//  As bibliotecas (pdf.js, ExcelJS, jsPDF, Tesseract) só são
//  baixadas do CDN; os dados nunca fazem o caminho de volta.
//  Só as regras de categoria que o Vitor cria ficam guardadas,
//  no próprio navegador, e são apenas palavras.
// ─────────────────────────────────────────────────────────────
window.VHG_EXTRATOS = (function () {
  "use strict";

  var L = window.VHG_EXTRATOS_LEITOR, C = window.VHG_EXTRATOS_CATEGORIAS;
  var LIBS = {
    pdfjs: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
    tesseract: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js",
    tesseractWorker: "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js",
    tesseractCore: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1",
    tesseractPor: "https://cdn.jsdelivr.net/npm/@tesseract.js-data/por@1.0.0/4.0.0_best_int"
  };

  var el, estado = novoEstado();
  function novoEstado() { return { arquivos: [], trans: [], cliente: "", aba: "analise", filtro: "", busca: "", processando: null, pendenteSenha: null, regraSugerida: null }; }

  function esc(s) { return String(s === undefined || s === null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var brl = C.brl, n1 = C.n1;
  function brl0(v) { return (v < 0 ? "−" : "") + "R$ " + Math.round(Math.abs(v)).toLocaleString("pt-BR"); }
  function dataBR(iso) { var p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function dm(iso) { var p = iso.split("-"); return p[2] + "/" + p[1]; }

  var scripts = {};
  function carregar(url) {
    if (!scripts[url]) scripts[url] = new Promise(function (ok, erro) {
      var s = document.createElement("script"); s.src = url; s.async = true; s.crossOrigin = "anonymous";
      s.onload = ok; s.onerror = function () { delete scripts[url]; erro(new Error("Não consegui carregar uma biblioteca. Verifique a internet e tente de novo.")); };
      document.head.appendChild(s);
    });
    return scripts[url];
  }

  var I = {
    up: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    file: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5"/><path d="M5 20h14"/></svg>',
    ok: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    alerta: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 8v5M12 16.5v.5"/><circle cx="12" cy="12" r="9"/></svg>',
    x: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  // ── Leitura dos arquivos ─────────────────────────────────────
  function palavrasDe(items, altura) {
    var out = [];
    items.forEach(function (it) {
      if (!it.str || !it.str.trim()) return;
      var x = it.transform[4], y = it.transform[5], fs = Math.hypot(it.transform[2], it.transform[3]) || it.height || 10;
      var top = altura - y - fs * 0.8, cw = it.width / Math.max(1, it.str.length), pos = 0;
      it.str.split(/(\s+)/).forEach(function (parte) {
        if (parte && !/^\s+$/.test(parte)) out.push({ text: parte, x0: x + pos * cw, x1: x + (pos + parte.length) * cw, top: top });
        pos += parte.length;
      });
    });
    return out;
  }

  async function lerPDF(buf, senha, aoProgresso) {
    await carregar(LIBS.pdfjs);
    var pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfjsWorker;
    var doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf), password: senha || undefined, isEvalSupported: false }).promise;
    var paginas = [], nPalavras = 0;
    for (var n = 1; n <= doc.numPages; n++) {
      var p = await doc.getPage(n), vp = p.getViewport({ scale: 1 });
      var tc = await p.getTextContent();
      var ws = palavrasDe(tc.items, vp.height);
      nPalavras += ws.length;
      paginas.push({ width: vp.width, height: vp.height, words: ws, _pagina: p });
    }
    var ocr = false;
    if (nPalavras < 25 * doc.numPages) {
      // PDF escaneado ou foto: reconhecimento de texto aqui no navegador
      ocr = true;
      await carregar(LIBS.tesseract);
      var worker = await window.Tesseract.createWorker("por", 1, {
        workerPath: LIBS.tesseractWorker, corePath: LIBS.tesseractCore, langPath: LIBS.tesseractPor,
        logger: function (m) { if (m.status === "recognizing text" && aoProgresso) aoProgresso(m.progress); }
      });
      try {
        for (var i = 0; i < paginas.length; i++) {
          if (aoProgresso) aoProgresso(0, "Lendo a imagem da página " + (i + 1) + " de " + paginas.length + "…");
          var escala = 2.5, vp2 = paginas[i]._pagina.getViewport({ scale: escala });
          var cv = document.createElement("canvas"); cv.width = vp2.width; cv.height = vp2.height;
          await paginas[i]._pagina.render({ canvasContext: cv.getContext("2d"), viewport: vp2 }).promise;
          var r = await worker.recognize(cv);
          var conv = function (w) { return { text: w.text, x0: w.bbox.x0 / escala, x1: w.bbox.x1 / escala, top: w.bbox.y1 / escala }; };
          var lsOCR = (r.data.lines || []).map(function (l) { return (l.words || []).map(conv); });
          var todas = []; lsOCR.forEach(function (l) { todas = todas.concat(l); });
          if (!todas.length) todas = (r.data.words || []).map(conv);
          paginas[i].words = L.endireitar(todas, lsOCR);
          paginas[i].tol = 4;
          cv.width = cv.height = 0;
        }
      } finally { await worker.terminate(); }
    }
    paginas.forEach(function (p) { delete p._pagina; });
    await doc.destroy();
    var info = L.ler(paginas);
    if (ocr) {
      info.ocr = true;
      info.conferencia.msg = "Lido por reconhecimento de imagem (PDF escaneado ou foto): revise os valores. " + info.conferencia.msg;
      if (info.conferencia.nivel === "ok") info.conferencia.nivel = "aviso";
    }
    return info;
  }

  async function processarArquivo(arq, senha) {
    var nome = arq.name, ext = (nome.split(".").pop() || "").toLowerCase();
    var buf = await arq.arrayBuffer();
    var info;
    if (ext === "pdf" || (new Uint8Array(buf.slice(0, 5)).join(",") === "37,80,68,70,45")) {
      info = await lerPDF(buf, senha, function (p, msg) { progresso(nome, p, msg); });
    } else {
      var txt = new TextDecoder("utf-8").decode(buf);
      if (/�/.test(txt)) txt = new TextDecoder("windows-1252").decode(buf);
      info = /<OFX>|OFXHEADER/i.test(txt) ? L.lerOFX(txt) : L.lerCSV(txt);
    }
    buf = null;
    return info;
  }

  function progresso(nome, p, msg) {
    var b = el && el.querySelector("[data-progresso]");
    if (!b) return;
    b.textContent = msg || ("Lendo " + nome + (p ? " · " + Math.round(p * 100) + "%" : "…"));
  }

  async function adicionar(files, senha) {
    files = Array.prototype.slice.call(files || []);
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      estado.processando = f.name; render();
      try {
        var info = await processarArquivo(f, senha);
        var idx = estado.arquivos.length;
        estado.arquivos.push({ nome: f.name, info: info });
        info.transacoes.forEach(function (t) { t.arquivo = idx; t.id = idx + "-" + Math.random().toString(36).slice(2, 8); });
        estado.trans = estado.trans.concat(info.transacoes);
        estado.pendenteSenha = null;
      } catch (e) {
        if (e && e.name === "PasswordException") {
          estado.pendenteSenha = { arquivo: f, errada: e.code === 2 };
          estado.processando = null; render();
          var campo = el.querySelector("#ext-senha"); if (campo) campo.focus();
          return;
        }
        estado.arquivos.push({ nome: f.name, info: { tipo: "", banco: "", transacoes: [], conferencia: { nivel: "erro", msg: (e && e.message) || "Não consegui ler este arquivo." } } });
      }
    }
    estado.processando = null;
    categorizarTudo();
    estado.aba = estado.aba || "analise";
    render();
  }

  function categorizarTudo() {
    var usuario = C.regrasDoUsuario();
    estado.trans.forEach(function (t) {
      if (t.manual) return;
      var c = C.categorizar(t, usuario);
      t.categoria = c.categoria; t.regra = c.regra;
    });
    estado.trans.sort(function (a, b) { return a.data < b.data ? -1 : a.data > b.data ? 1 : 0; });
  }

  function limpar() {
    estado = novoEstado();
    var inp = el.querySelector("#ext-arquivo"); if (inp) inp.value = "";
    render();
  }

  // ── Telas ─────────────────────────────────────────────────────
  function render() {
    if (!el) return;
    var tem = estado.arquivos.length > 0;
    var a = tem ? C.analisar(estado.trans) : null;
    estado._analise = a;
    el.innerHTML =
      '<div class="ext">' +
        '<div class="ext-principal">' + (tem ? telaArquivos() + abas(a) + conteudo(a) : telaEnvio()) + '</div>' +
        '<aside class="ext-lado">' + (tem ? ladoResultados(a) : ladoPrivacidade()) + '</aside>' +
      '</div>';
    ligar();
  }

  function telaEnvio() {
    return (estado.pendenteSenha ? caixaSenha() : "") +
      '<label class="ext-drop" for="ext-arquivo" data-drop>' +
        '<span class="ic">' + I.up + '</span>' +
        '<span class="ext-drop-t">Arraste a fatura ou o extrato aqui</span>' +
        '<span class="ext-drop-s">ou clique para escolher. Pode enviar vários arquivos e vários meses de uma vez.</span>' +
        '<span class="btn btn-petroleo">ESCOLHER ARQUIVOS</span>' +
        '<span class="ext-formatos"><span class="ext-pill ok">PDF DO BANCO</span><span class="ext-pill ok">PDF COM SENHA</span><span class="ext-pill ok">PDF ESCANEADO</span><span class="ext-pill">OFX · CSV</span></span>' +
      '</label>' +
      '<input type="file" id="ext-arquivo" accept=".pdf,.ofx,.csv,.txt,application/pdf" multiple hidden>' +
      (estado.processando ? '<div class="ext-lendo" data-progresso>Lendo ' + esc(estado.processando) + '…</div>' : "") +
      '<div class="card ext-card"><div class="eyebrow" style="letter-spacing:.22em">QUALQUER BANCO, QUALQUER LAYOUT</div>' +
      '<div class="texto-apoio">A ferramenta procura as linhas com <b>data, descrição e valor</b> em qualquer lugar do PDF, sem modelo por banco. Funciona com <b>fatura de cartão</b> e <b>extrato de conta</b>. No fim, confere a soma com o total da fatura ou com os saldos do extrato.</div></div>';
  }

  function caixaSenha() {
    var p = estado.pendenteSenha;
    return '<form class="ext-senha" data-form-senha>' +
      '<div><b>' + esc(p.arquivo.name) + '</b> tem senha.' + (p.errada ? ' <span class="ext-erro-txt">A senha não confere.</span>' : '') +
      '<br><span class="pequeno">Geralmente é o CPF do cliente (só números). A senha não fica guardada.</span></div>' +
      '<div class="ext-senha-linha"><input type="password" id="ext-senha" autocomplete="off" placeholder="Senha do PDF">' +
      '<button type="submit" class="btn btn-petroleo">ABRIR</button><button type="button" class="btn btn-linha" data-cancelar-senha>CANCELAR</button></div></form>';
  }

  function telaArquivos() {
    var itens = estado.arquivos.map(function (f, i) {
      var c = f.info.conferencia || {}, ic = c.nivel === "ok" ? I.ok : c.nivel === "erro" ? I.x : I.alerta;
      var desc = [f.info.tipo === "cartao" ? "Fatura de cartão" : f.info.tipo === "conta" ? "Extrato de conta" : "", f.info.banco, f.info.transacoes.length ? f.info.transacoes.length + " lançamentos" : ""].filter(Boolean).join(" · ");
      return '<div class="ext-arq">' + I.file +
        '<div class="ext-arq-tx"><div class="nome">' + esc(f.nome) + '</div><div class="meta">' + esc(desc) + '</div>' +
        '<div class="ext-conf ' + (c.nivel || "") + '">' + ic + '<span>' + esc(c.msg || "") + '</span></div></div>' +
        '<button type="button" class="ext-remover" data-remover="' + i + '" aria-label="Remover ' + esc(f.nome) + '">' + I.x + '</button></div>';
    }).join("");
    return (estado.pendenteSenha ? caixaSenha() : "") +
      '<div class="ext-arqs">' + itens +
      '<div class="ext-arqs-acoes"><label class="btn btn-linha" for="ext-arquivo">+ ADICIONAR ARQUIVO</label>' +
      '<input type="file" id="ext-arquivo" accept=".pdf,.ofx,.csv,.txt,application/pdf" multiple hidden>' +
      '<button type="button" class="btn btn-linha" data-limpar>LIMPAR TUDO</button></div>' +
      (estado.processando ? '<div class="ext-lendo" data-progresso>Lendo ' + esc(estado.processando) + '…</div>' : "") +
      '</div>';
  }

  function abas(a) {
    var n = estado.trans.length, nr = a.revisar.length;
    function b(k, rot) { return '<button type="button" class="' + (estado.aba === k ? "on" : "") + '" data-ext-aba="' + k + '">' + rot + '</button>'; }
    return '<div class="ext-abas">' + b("analise", "ANÁLISE") + b("lancamentos", "LANÇAMENTOS<span class=\"cont\">" + n + "</span>" + (nr ? '<span class="ext-badge">' + nr + '</span>' : "")) + b("regras", "REGRAS") + '</div>';
  }

  function conteudo(a) {
    if (!estado.trans.length) return '<div class="vazio-tab">Nenhum lançamento lido ainda. Veja o aviso no arquivo acima.</div>';
    if (estado.aba === "lancamentos") return telaLancamentos(a);
    if (estado.aba === "regras") return telaRegras();
    return telaAnalise(a);
  }

  function periodo(a) {
    if (!a.meses.length) return "";
    return a.meses.length === 1 ? C.nomeMes(a.meses[0]) : C.nomeMes(a.meses[0]) + " a " + C.nomeMes(a.meses[a.meses.length - 1]);
  }

  function kpis(a) {
    var k = [];
    if (a.modoRenda) {
      k.push(["ENTRADAS", brl0(a.totalReceitas), "Salário, PIX e depósitos"]);
      k.push(["GASTOS", brl0(a.totalGastos), a.nGastos + " lançamentos"]);
      k.push(["INVESTIDO", brl0(a.investido), "Aplicações no período"]);
      k.push(["SOBRA", brl0(a.sobra), n1(a.sobra / a.totalReceitas * 100) + "% da renda", true]);
    } else {
      k.push(["GASTOS", brl0(a.totalGastos), a.nGastos + " lançamentos"]);
      k.push([a.meses.length > 1 ? "MÉDIA POR MÊS" : "MAIOR CATEGORIA", a.meses.length > 1 ? brl0(a.mediaMensalGastos) : (a.cats[0] ? brl0(a.cats[0].total) : "—"), a.meses.length > 1 ? a.meses.length + " meses" : (a.cats[0] ? a.cats[0].categoria : "")]);
      k.push(["PARCELAS A VENCER", brl0(a.totalParcelasFuturas), a.parcelas.length + " compras parceladas"]);
      k.push(["ASSINATURAS", brl0(a.totalAssinaturas / Math.max(1, a.meses.length)), "por mês", true]);
    }
    return '<div class="ext-kpis">' + k.map(function (x) { return '<div class="ext-kpi' + (x[3] ? " escuro" : "") + '"><div class="r">' + x[0] + '</div><div class="v">' + x[1] + '</div><div class="s">' + esc(x[2]) + '</div></div>'; }).join("") + '</div>';
  }

  function telaAnalise(a) {
    var max = a.cats[0] ? a.cats[0].total : 1;
    var barras = a.cats.map(function (c) {
      return '<button type="button" class="ext-barra' + (c.categoria === "A revisar" ? " rev" : "") + '" data-ver-cat="' + esc(c.categoria) + '" title="Ver lançamentos de ' + esc(c.categoria) + '">' +
        '<span class="nm">' + esc(c.categoria) + '</span><span class="tr"><span class="en" style="width:' + Math.max(0.6, c.total / max * 100).toFixed(1) + '%"></span></span>' +
        '<span class="vl">' + brl(c.total) + '</span><span class="pc">' + n1(c.pct) + '%</span></button>';
    }).join("");
    var meses = "";
    if (a.porMes.length > 1) {
      var mm = Math.max.apply(null, a.porMes.map(function (m) { return Math.max(m.gastos, m.entradas); })) || 1;
      meses = '<div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">MÊS A MÊS</div><h3>Gastos por mês</h3><div class="ext-barras">' +
        a.porMes.map(function (m) { return '<div class="ext-barra estatica"><span class="nm">' + esc(C.nomeMes(m.mes)) + '</span><span class="tr"><span class="en" style="width:' + (m.gastos / mm * 100).toFixed(1) + '%"></span></span><span class="vl">' + brl(m.gastos) + '</span><span class="pc"></span></div>'; }).join("") + '</div></div>';
    }
    var top = a.top.slice(0, 8).map(function (t) { return '<tr><td>' + esc(t.descricao) + '</td><td class="c">' + dm(t.data) + '</td><td class="v">' + brl(-t.valor) + '</td></tr>'; }).join("");
    var rec = a.recorrentes.slice(0, 10).map(function (t) { return '<tr><td>' + esc(t.descricao) + '</td><td class="c">' + esc(t.categoria) + '</td><td class="v">' + brl(-t.valor) + '</td></tr>'; }).join("");
    var parc = a.parcelas.length ? '<div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">COMPRAS PARCELADAS</div><h3>O que ainda vem nas próximas faturas</h3><table class="ext-mini"><tr><th>COMPRA</th><th>PARCELA</th><th class="v">VALOR</th><th class="v">FALTA PAGAR</th></tr>' +
      a.parcelas.slice(0, 12).map(function (p) { return '<tr><td>' + esc(p.t.descricao) + '</td><td class="c">' + p.t.parcela.atual + ' de ' + p.t.parcela.total + '</td><td class="v">' + brl(-p.t.valor) + '</td><td class="v">' + brl(p.restante) + '</td></tr>'; }).join("") +
      '<tr class="tot"><td>Total</td><td></td><td></td><td class="v">' + brl(a.totalParcelasFuturas) + '</td></tr></table></div>' : "";
    return '<div class="ext-periodo">' + esc(periodo(a)) + '</div>' + kpis(a) +
      '<div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">POR CATEGORIA</div><h3>Para onde foi o dinheiro</h3><div class="ext-barras">' + barras + '</div><div class="pequeno" style="margin-top:12px">Clique numa categoria para ver os lançamentos.</div></div>' +
      meses +
      (a.destaques.length ? '<div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">LEITURA AUTOMÁTICA</div><h3>O que chama atenção</h3><div class="ext-insights">' + a.destaques.map(function (d) { return '<div class="ext-insight"><div class="t">' + d.t + '</div>' + d.h + '</div>'; }).join("") + '</div></div>' : "") +
      '<div class="ext-dois"><div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">MAIORES GASTOS</div><table class="ext-mini">' + top + '</table></div>' +
      '<div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">TODO MÊS</div><table class="ext-mini">' + (rec || '<tr><td class="c">Nenhuma conta fixa identificada.</td></tr>') +
      (rec ? '<tr class="tot"><td>Total</td><td></td><td class="v">' + brl(a.totalRecorrentes) + '</td></tr>' : "") + '</table></div></div>' + parc;
  }

  function opcoesCategoria(sel) {
    return C.CATEGORIAS.map(function (c) { return '<option' + (c === sel ? " selected" : "") + '>' + esc(c) + '</option>'; }).join("");
  }

  function telaLancamentos(a) {
    var cont = {};
    estado.trans.forEach(function (t) { cont[t.categoria] = (cont[t.categoria] || 0) + 1; });
    var cats = Object.keys(cont).sort(function (x, y) { return (x === "A revisar" ? -1 : y === "A revisar" ? 1 : cont[y] - cont[x]); });
    var filtros = '<button type="button" class="ext-pill' + (!estado.filtro ? " on" : "") + '" data-filtro="">TODAS · ' + estado.trans.length + '</button>' +
      cats.map(function (c) { return '<button type="button" class="ext-pill' + (estado.filtro === c ? " on" : "") + (c === "A revisar" ? " rev" : "") + '" data-filtro="' + esc(c) + '">' + esc(c.toUpperCase()) + ' · ' + cont[c] + '</button>'; }).join("");
    var q = C.chaveComercio ? estado.busca.toUpperCase() : "";
    var lista = estado.trans.filter(function (t) {
      return (!estado.filtro || t.categoria === estado.filtro) && (!q || (t.original + " " + t.descricao).toUpperCase().indexOf(q) >= 0);
    });
    var multi = estado.arquivos.length > 1;
    var linhas = lista.map(function (t) {
      var arq = estado.arquivos[t.arquivo];
      var sug = estado.regraSugerida && estado.regraSugerida.id === t.id ? linhaRegra(t) : "";
      return '<tr class="' + (t.categoria === "A revisar" ? "rev" : "") + '"><td class="d">' + dm(t.data) + '</td>' +
        '<td><b>' + esc(t.descricao) + '</b>' + (t.parcela ? '<span class="ext-tag">' + t.parcela.atual + '/' + t.parcela.total + '</span>' : "") +
        (multi && arq ? '<span class="ext-orig">' + esc(arq.info.banco || arq.nome) + (arq.info.tipo === "cartao" ? " · cartão" : " · conta") + '</span>' : "") + '</td>' +
        '<td><select data-cat="' + t.id + '" aria-label="Categoria">' + opcoesCategoria(t.categoria) + '</select></td>' +
        '<td class="v' + (t.valor > 0 ? " pos" : "") + '">' + brl(t.valor).replace("R$", t.valor > 0 ? "+R$" : "R$") + '</td></tr>' + sug;
    }).join("");
    return '<div class="ext-filtros">' + filtros + '</div>' +
      '<input type="search" class="ext-busca" data-busca placeholder="Buscar descrição" value="' + esc(estado.busca) + '">' +
      '<div class="bloco ext-bloco ext-tabela-wrap"><table class="ext-tab"><thead><tr><th>DATA</th><th>DESCRIÇÃO</th><th>CATEGORIA</th><th class="v">VALOR</th></tr></thead><tbody>' +
      (linhas || '<tr><td colspan="4" class="c">Nenhum lançamento neste filtro.</td></tr>') + '</tbody></table></div>';
  }

  function linhaRegra(t) {
    var r = estado.regraSugerida;
    return '<tr class="ext-sug"><td colspan="4"><form data-form-regra>Usar <b>' + esc(t.categoria) + '</b> sempre que a descrição tiver ' +
      '<input type="text" id="ext-palavra" value="' + esc(r.palavra) + '" aria-label="Palavra-chave">' +
      '<button type="submit" class="btn btn-petroleo">CRIAR REGRA</button><button type="button" class="btn btn-linha" data-so-este>SÓ ESTE</button></form></td></tr>';
  }

  function telaRegras() {
    var us = C.regrasDoUsuario();
    var lista = us.length ? us.map(function (r, i) { return '<div class="ext-regra"><code>' + esc(r[0]) + '</code><span>' + esc(r[1]) + '</span><button type="button" class="ext-remover" data-apagar-regra="' + i + '" aria-label="Apagar regra">' + I.x + '</button></div>'; }).join("")
      : '<div class="pequeno">Você ainda não criou regras. Ao trocar a categoria de um lançamento, a ferramenta oferece criar uma.</div>';
    return '<div class="bloco ext-bloco"><div class="eyebrow" style="letter-spacing:.22em">SUAS REGRAS</div><h3>Palavra-chave → categoria</h3>' +
      '<div class="texto-apoio" style="margin-bottom:14px">Se a descrição do banco tiver a palavra, o lançamento vai para a categoria. Suas regras valem antes das ' + C.REGRAS.length + ' regras prontas. Ficam guardadas só neste navegador e são só palavras, nunca valores ou dados de cliente.</div>' +
      '<div class="ext-regras">' + lista + '</div>' +
      '<form class="ext-nova-regra" data-nova-regra><input type="text" id="ext-nova-palavra" placeholder="Palavra-chave, ex.: PADARIA DA ESQUINA" required><select id="ext-nova-cat">' + opcoesCategoria("Alimentação fora") + '</select><button type="submit" class="btn btn-petroleo">ADICIONAR</button></form>' +
      '<div class="ext-regras-acoes"><button type="button" class="btn btn-linha" data-exportar-regras>EXPORTAR REGRAS</button><label class="btn btn-linha" for="ext-importar">IMPORTAR REGRAS</label><input type="file" id="ext-importar" accept=".json" hidden></div>' +
      '<div class="pequeno" style="margin-top:10px">Use exportar e importar para levar suas regras para outro computador.</div></div>';
  }

  function ladoPrivacidade() {
    return '<div class="card-escuro"><div class="eyebrow cobre">O EXTRATO NÃO SAI DAQUI</div><ul class="ext-priv">' +
      '<li>' + I.lock + '<span>O arquivo é lido <b>aqui, no seu navegador</b>. Nada é enviado para servidor, Supabase ou nuvem.</span></li>' +
      '<li>' + I.lock + '<span>Nada fica salvo. Ao fechar a aba ou clicar em <b>Limpar tudo</b>, o extrato e a análise somem.</span></li>' +
      '<li>' + I.lock + '<span>Senhas de PDF são usadas só para abrir o arquivo e não ficam guardadas.</span></li></ul></div>' +
      '<div class="card" style="padding:24px 28px"><div class="eyebrow" style="letter-spacing:.22em">COMO FUNCIONA</div><ol class="ext-passos">' +
      '<li>Envie a fatura ou o extrato em PDF.</li><li>Confira a análise e ajuste as categorias.</li><li>Baixe o <b>PDF</b>, o <b>Excel</b> e o <b>.txt</b>.</li><li>Clique em <b>Limpar tudo</b> ou feche a aba.</li></ol></div>';
  }

  function ladoResultados(a) {
    return '<div class="card ext-cliente"><label for="ext-cliente">NOME DO CLIENTE (SÓ APARECE NO PDF)</label><input type="text" id="ext-cliente" value="' + esc(estado.cliente) + '" placeholder="Opcional" autocomplete="off"></div>' +
      '<div class="card-escuro"><div class="eyebrow cobre">BAIXAR RESULTADOS</div><div class="ext-baixar">' +
      '<button type="button" class="prim" data-baixar="pdf">' + I.file + '<span class="tx"><b>Análise em PDF</b><span>No visual VHG, para o cliente</span></span>' + I.down + '</button>' +
      '<button type="button" data-baixar="xlsx">' + I.file + '<span class="tx"><b>Planilha Excel</b><span>Resumo, categorias e lançamentos</span></span>' + I.down + '</button>' +
      '<button type="button" data-baixar="txt">' + I.file + '<span class="tx"><b>Extrato limpo (.txt)</b><span>Texto simples</span></span>' + I.down + '</button></div>' +
      '<div class="ext-status" data-status role="status"></div>' +
      '<div class="ext-nota">' + I.lock + '<span>Os arquivos são criados aqui no navegador e vão direto para a pasta de Downloads. Nada fica salvo no site.</span></div></div>' +
      (a.revisar.length ? '<div class="ext-alerta"><b>' + a.revisar.length + (a.revisar.length > 1 ? " lançamentos" : " lançamento") + ' sem categoria.</b> Classifique para entrarem certo no PDF.<br><button type="button" class="btn btn-linha" data-ver-cat="A revisar">REVISAR AGORA</button></div>' : "");
  }

  // ── Eventos ───────────────────────────────────────────────────
  function ligar() {
    var inp = el.querySelector("#ext-arquivo");
    if (inp) inp.addEventListener("change", function () { adicionar(inp.files); });
    var drop = el.querySelector("[data-drop]") || el.querySelector(".ext-arqs");
    if (drop) {
      ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("sobre"); }); });
      ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("sobre"); }); });
      drop.addEventListener("drop", function (e) { if (e.dataTransfer && e.dataTransfer.files.length) adicionar(e.dataTransfer.files); });
    }
    on("[data-form-senha]", "submit", function (e) {
      e.preventDefault();
      var s = el.querySelector("#ext-senha").value, f = estado.pendenteSenha.arquivo;
      adicionar([f], s);
    });
    on("[data-cancelar-senha]", "click", function () { estado.pendenteSenha = null; render(); });
    on("[data-limpar]", "click", limpar);
    on("[data-remover]", "click", function (e, b) {
      var i = +b.dataset.remover;
      estado.arquivos.splice(i, 1);
      estado.trans = estado.trans.filter(function (t) { return t.arquivo !== i; }).map(function (t) { if (t.arquivo > i) t.arquivo--; return t; });
      if (!estado.arquivos.length) return limpar();
      render();
    });
    on("[data-ext-aba]", "click", function (e, b) { estado.aba = b.dataset.extAba; estado.regraSugerida = null; render(); });
    on("[data-ver-cat]", "click", function (e, b) { estado.aba = "lancamentos"; estado.filtro = b.dataset.verCat; render(); el.scrollIntoView({ behavior: "smooth", block: "start" }); });
    on("[data-filtro]", "click", function (e, b) { estado.filtro = b.dataset.filtro; estado.regraSugerida = null; render(); });
    var busca = el.querySelector("[data-busca]");
    if (busca) busca.addEventListener("input", function () {
      estado.busca = busca.value; var pos = busca.selectionStart; render();
      var nb = el.querySelector("[data-busca]"); nb.focus(); nb.setSelectionRange(pos, pos);
    });
    on("[data-cat]", "change", function (e, s) {
      var t = estado.trans.filter(function (x) { return x.id === s.dataset.cat; })[0];
      if (!t) return;
      t.categoria = s.value; t.manual = true;
      estado.regraSugerida = { id: t.id, palavra: sugerirPalavra(t.original) };
      render();
      var p = el.querySelector("#ext-palavra"); if (p) p.focus();
    });
    on("[data-form-regra]", "submit", function (e) {
      e.preventDefault();
      var t = estado.trans.filter(function (x) { return x.id === estado.regraSugerida.id; })[0];
      var palavra = el.querySelector("#ext-palavra").value.trim().toUpperCase();
      if (palavra && t) {
        var us = C.regrasDoUsuario().filter(function (r) { return r[0] !== palavra; });
        us.unshift([palavra, t.categoria]); C.salvarRegras(us);
        // aplica a regra nova aos outros lançamentos parecidos
        estado.trans.forEach(function (x) { if (x !== t && x.manual) return; x.manual = x === t; });
        categorizarTudo();
      }
      estado.regraSugerida = null; render();
    });
    on("[data-so-este]", "click", function () { estado.regraSugerida = null; render(); });
    on("[data-apagar-regra]", "click", function (e, b) {
      var us = C.regrasDoUsuario(); us.splice(+b.dataset.apagarRegra, 1); C.salvarRegras(us); categorizarTudo(); render();
    });
    on("[data-nova-regra]", "submit", function (e) {
      e.preventDefault();
      var p = el.querySelector("#ext-nova-palavra").value.trim().toUpperCase(), c = el.querySelector("#ext-nova-cat").value;
      if (!p) return;
      var us = C.regrasDoUsuario().filter(function (r) { return r[0] !== p; }); us.unshift([p, c]); C.salvarRegras(us); categorizarTudo(); render();
    });
    on("[data-exportar-regras]", "click", function () {
      baixarBlob(new Blob([JSON.stringify(C.regrasDoUsuario(), null, 1)], { type: "application/json" }), "regras-extratos-vhg.json");
    });
    var imp = el.querySelector("#ext-importar");
    if (imp) imp.addEventListener("change", async function () {
      try {
        var r = JSON.parse(await imp.files[0].text());
        if (!Array.isArray(r)) throw 0;
        var limpas = r.filter(function (x) { return Array.isArray(x) && typeof x[0] === "string" && C.CATEGORIAS.indexOf(x[1]) >= 0; }).map(function (x) { return [x[0].toUpperCase().slice(0, 60), x[1]]; });
        var us = C.regrasDoUsuario(), ja = {};
        us.forEach(function (x) { ja[x[0]] = 1; });
        limpas.forEach(function (x) { if (!ja[x[0]]) us.push(x); });
        C.salvarRegras(us); categorizarTudo(); render();
      } catch (e) { alertaStatus("Arquivo de regras inválido."); }
    });
    var cli = el.querySelector("#ext-cliente");
    if (cli) cli.addEventListener("input", function () { estado.cliente = cli.value; });
    on("[data-baixar]", "click", async function (e, b) {
      var tipo = b.dataset.baixar, S = window.VHG_EXTRATOS_SAIDAS;
      b.disabled = true; alertaStatus("Gerando o arquivo…");
      try {
        var dados = dadosSaida();
        var r = tipo === "pdf" ? await S.pdf(dados) : tipo === "xlsx" ? await S.xlsx(dados) : S.txt(dados);
        baixarBlob(r.blob, r.nome);
        alertaStatus("Pronto: " + r.nome);
      } catch (err) {
        console.error(err);
        alertaStatus((err && err.message) || "Não consegui gerar o arquivo.");
      } finally { b.disabled = false; }
    });
  }
  function on(sel, ev, fn) { el.querySelectorAll(sel).forEach(function (n) { n.addEventListener(ev, function (e) { fn(e, n); }); }); }
  function alertaStatus(m) { var s = el.querySelector("[data-status]"); if (s) s.textContent = m; }

  function sugerirPalavra(orig) {
    var p = String(orig).toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/^(COMPRA (COM )?(CARTAO|DEB(ITO)?)|DEB(ITO)? AUT(OMATICO)?|PAG(AMENTO)? (DE )?BOLETO|PIX (ENVIADO|RECEBIDO|QR CODE( DINAMICO| ESTATICO)?)|TED|TRANSF\w*)\s+/, "")
      .replace(/\d{2}\/\d{2}.*$/, "").replace(/[^A-Z0-9*&. ]/g, " ").replace(/\s+/g, " ").trim();
    return p.split(" ").slice(0, 3).join(" ");
  }

  function baixarBlob(blob, nome) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function dadosSaida() {
    var a = C.analisar(estado.trans);
    return {
      cliente: estado.cliente.trim(), analise: a, periodo: periodo(a), trans: estado.trans,
      arquivos: estado.arquivos.map(function (f) { return { nome: f.nome, banco: f.info.banco, tipo: f.info.tipo, n: f.info.transacoes.length, conferencia: f.info.conferencia }; }),
      regras: C.regrasDoUsuario(), geradoEm: new Date()
    };
  }

  // Ao sair da página, não sobra nada na memória da aba.
  window.addEventListener("pagehide", function () { estado = novoEstado(); });

  return {
    montar: function (alvo) { el = alvo; render(); },
    _estado: function () { return estado; },
    _adicionar: adicionar
  };
})();
