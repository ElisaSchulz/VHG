// ─────────────────────────────────────────────────────────────
//  extratos-leitor.js — lê faturas de cartão e extratos de conta
//
//  Leitor genérico: não tem modelo por banco. Reconhece cada
//  lançamento pelo conteúdo (data + descrição + valor) e pela
//  posição das palavras na página, então continua funcionando
//  quando o banco muda o layout. No fim, confere os totais.
//
//  Tudo roda no navegador. Nenhum dado é enviado a lugar nenhum.
//  Entrada: páginas no formato
//    { width, height, words: [{ text, x0, x1, top }] }
//  (montadas a partir do pdf.js, do OCR ou de testes).
// ─────────────────────────────────────────────────────────────
(function (root) {
  "use strict";

  var MESES = { JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6, JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12 };
  var R_DATA = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/;
  var R_VAL = /^[-−–]?(?:R\$)?[-−–]?(?:\d{1,3}(?:\.\d{3})+|\d+),\d{2}[-−–]?[CD]?$/;
  var R_PARC = /(?:^|\s|[A-Za-z*])(\d{1,2})\s?\/\s?(\d{1,2})$/;
  var SINAIS = { "-": 1, "−": 1, "–": 1, "-R$": 1, "−R$": 1, "–R$": 1 };

  function sem(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function norm(s) { return sem(s).toLowerCase(); }
  function ehValor(t) { return R_VAL.test(String(t).replace(/^R\$/, "")); }
  function valorDe(t) {
    t = String(t);
    var neg = /[-−–]/.test(t) || /D$/.test(t);
    var v = parseFloat(t.replace(/[^\d,]/g, "").replace(",", "."));
    return neg ? -v : v;
  }

  // ── Linhas: agrupa palavras com o mesmo "top" ───────────────
  function linhas(words, tol) {
    tol = tol || 1.8;
    var ws = words.slice().sort(function (a, b) { return a.top - b.top || a.x0 - b.x0; });
    var ls = [];
    ws.forEach(function (w) {
      var ult = ls[ls.length - 1];
      if (ult && Math.abs(ult.top - w.top) <= tol) ult.w.push(w);
      else ls.push({ top: w.top, w: [w] });
    });
    ls.forEach(function (l) { l.w.sort(function (a, b) { return a.x0 - b.x0; }); l.txt = l.w.map(function (w) { return w.text; }).join(" "); });
    return ls;
  }

  // ── Data no começo da linha: "15/12", "15/12/2025", "18 OUT" ─
  function dataEm(ws, i) {
    var t = ws[i] && ws[i].text;
    if (!t) return null;
    var m = R_DATA.exec(t);
    if (m) {
      var d = +m[1], mes = +m[2];
      if (d >= 1 && d <= 31 && mes >= 1 && mes <= 12) return { n: 1, d: d, m: mes, a: m[3] ? +(m[3].length === 2 ? "20" + m[3] : m[3]) : null };
    }
    if (/^\d{1,2}$/.test(t) && ws[i + 1]) {
      var mm = MESES[sem(ws[i + 1].text).toUpperCase().replace(/\.$/, "")];
      if (mm && +t >= 1 && +t <= 31) {
        var a = ws[i + 2] && /^\d{4}$/.test(ws[i + 2].text) ? +ws[i + 2].text : null;
        return { n: a ? 3 : 2, d: +t, m: mm, a: a };
      }
    }
    return null;
  }
  function dataNoInicio(ws) {
    for (var i = 0; i < Math.min(3, ws.length); i++) {
      var d = dataEm(ws, i);
      if (d) return { i: i, d: d };
      if (!/^[\d@#*•]{1,2}$/.test(ws[i].text)) break; // só pula marcadores curtos (ex.: "3" do Santander)
    }
    return null;
  }

  // ── Colunas: datas que abrem lançamentos em dois "x" distintos ─
  function colunas(width, words, tol) {
    var xs = [];
    linhas(words, tol).forEach(function (l) {
      var ws = l.w;
      for (var i = 0; i < ws.length - 1; i++) {
        var d = dataEm(ws, i);
        if (!d) continue;
        var prox = ws[i + d.n] ? ws[i + d.n].text : "";
        if (!ehValor(prox) && !R_DATA.test(prox) && /[A-Za-zÀ-ú]/.test(prox)) xs.push(Math.round(ws[i].x0));
      }
    });
    xs.sort(function (a, b) { return a - b; });
    var grupos = [];
    xs.forEach(function (x) {
      var g = grupos[grupos.length - 1];
      if (g && x - g[g.length - 1] < 40) g.push(x); else grupos.push([x]);
    });
    grupos = grupos.filter(function (g) { return g.length >= 3; });
    var bordas = [0].concat(grupos.slice(1).map(function (g) { return g[0] - 20; })).concat([width + 1]);
    var cols = [];
    for (var i = 0; i < bordas.length - 1; i++) cols.push([bordas[i], bordas[i + 1]]);
    return cols;
  }

  // ── Cabeçalho de extrato de conta: "Crédito ... Débito ... Saldo" ─
  function cabecalhoConta(words, tol) {
    var achado = null;
    linhas(words, tol).some(function (l) {
      var c = {};
      l.w.forEach(function (w) {
        var t = norm(w.text).replace(/[^a-z]/g, "");
        ["credito", "debito", "saldo", "entradas", "saidas", "valor"].forEach(function (k) {
          if (t.indexOf(k) === 0 && c[k] === undefined) c[k] = (w.x0 + w.x1) / 2;
        });
      });
      if (c.entradas !== undefined && c.saidas !== undefined) { c.credito = c.entradas; c.debito = c.saidas; }
      // Cabeçalho de tabela: linha curta, com "data"/"histórico"/"saldo" junto (frases do rodapé não contam)
      var nt = norm(l.txt);
      if (c.credito !== undefined && c.debito !== undefined && l.w.length <= 14 && /\bdata\b|historico|descri|lancamento|saldo/.test(nt)) { achado = c; return true; }
      return false;
    });
    return achado;
  }

  // ── Tipo do documento e banco ───────────────────────────────
  var BANCOS = [
    ["Nubank", /nubank|nu pagamentos/], ["Itaú", /itau|ita[uú] cart/], ["Bradesco", /bradesco/], ["Santander", /santander/],
    ["Banco do Brasil", /banco do brasil|bb\.com|ourocard/], ["Caixa", /caixa economica|caixa\.gov/], ["Inter", /banco inter|bancointer/],
    ["C6 Bank", /c6 bank|banco c6/], ["BTG Pactual", /btg/], ["XP", /banco xp|xp investimentos/], ["Sicoob", /sicoob/], ["Sicredi", /sicredi/],
    ["PicPay", /picpay/], ["Mercado Pago", /mercado pago|mercadopago/], ["Neon", /banco neon|neon pagamentos/], ["PagBank", /pagbank|pagseguro/]
  ];
  function detectarBanco(txt) {
    var t = norm(txt);
    for (var i = 0; i < BANCOS.length; i++) if (BANCOS[i][1].test(t)) return BANCOS[i][0];
    return "";
  }

  // ── Ano dos lançamentos "DD/MM" (faturas não trazem o ano) ─────
  function dataReferencia(txt) {
    var ref = null, m;
    var r1 = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g;
    while ((m = r1.exec(txt))) {
      var a = +m[3], dt = new Date(a, +m[2] - 1, +m[1]);
      if (a > 2000 && a < 2100 && +m[2] <= 12 && (!ref || dt > ref)) ref = dt;
    }
    var r2 = /\b(\d{1,2}) (JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ) (\d{4})\b/gi;
    while ((m = r2.exec(sem(txt)))) {
      var dt2 = new Date(+m[3], MESES[m[2].toUpperCase()] - 1, +m[1]);
      if (!ref || dt2 > ref) ref = dt2;
    }
    return ref || new Date();
  }
  function iso(d, ref) {
    var a = d.a;
    if (!a) {
      a = ref.getFullYear();
      if (new Date(a, d.m - 1, d.d) - ref > 20 * 864e5) a -= 1; // data depois da referência: é do ano anterior
    }
    return a + "-" + String(d.m).padStart(2, "0") + "-" + String(d.d).padStart(2, "0");
  }

  var R_FORA = /pr[oó]xima?s? faturas?|parcelas a vencer|lan[cç]amentos futuros|compras parceladas\s*-\s*pr|simula[cç][aã]o/;
  var R_DENTRO = /^lan[cç]amentos|^transa[cç][oõ]es|^detalhamento|^despesas|^movimenta[cç]/;
  var R_RESUMO = /^(\(.\)\s*)?(total|saldo|valor total|subtotal|pagamento minimo|limite)\b/;
  var R_PAGAMENTO = /pagamento|pgto|pag fatura|pagto|pag\. fatura|pagamento recebido/;
  var HINTS = { "alimentacao": "Alimentação fora", "veiculos": "Transporte", "saude": "Saúde", "vestuario": "Compras", "turismo e entretenim": "Lazer e viagens", "hobby": "Lazer e viagens", "educacao": "Educação", "supermercados": "Mercado", "supermercado": "Mercado", "farmacia": "Saúde", "restaurante": "Alimentação fora", "combustivel": "Transporte" };

  // ── Leitura de um documento ──────────────────────────────────
  function ler(paginas, opcoes) {
    opcoes = opcoes || {};
    var todoTexto = paginas.map(function (p) { return linhas(p.words, p.tol).map(function (l) { return l.txt; }).join("\n"); }).join("\n");
    var tn = norm(todoTexto);
    var algumCab = null;
    paginas.some(function (p) { algumCab = cabecalhoConta(p.words, p.tol); return !!algumCab; });
    var inicio = tn.slice(0, 2500);
    var tipo = opcoes.tipo || (/fatura/.test(inicio) || (/vencimento/.test(tn) && /limite (total|de credito|disponivel)/.test(tn)) ? "cartao" : "conta");
    if (algumCab && tipo === "cartao" && !/fatura/.test(inicio)) tipo = "conta";
    var ref = dataReferencia(todoTexto);
    var trans = [], resumo = [];
    var ultimaData = null;

    paginas.forEach(function (pg, pi) {
      var cab = cabecalhoConta(pg.words, pg.tol) || (tipo === "conta" ? algumCab : null);
      colunas(pg.width, pg.words, pg.tol).forEach(function (col) {
        var ws = pg.words.filter(function (w) { return w.x0 >= col[0] && w.x0 < col[1]; });
        var ls = linhas(ws, pg.tol), pular = false;
        var achados = []; // índices de linhas que viraram lançamento

        ls.forEach(function (l, li) {
          var w = l.w, t = norm(l.txt);
          var valsLinha = w.filter(function (x) { return ehValor(x.text); });
          if (valsLinha.length && /total|saldo|lancamentos atuais|a pagar|fatura anterior|despesas|pagamento/.test(t)) {
            resumo.push({ txt: l.txt, t: t, vals: valsLinha.map(function (x) { return valorDe(x.text); }) });
          }
          if (R_FORA.test(t) && !/\d,\d{2}$/.test(t)) pular = true;
          if (R_DENTRO.test(t)) pular = false;
          if (pular) return;

          var iv = -1;
          for (var k = 0; k < w.length; k++) if (ehValor(w[k].text)) { iv = k; break; }
          if (iv < 0) return;
          var ini = dataNoInicio(w), data, corpo;
          if (ini && ini.i + ini.d.n <= iv) {
            data = ini.d; ultimaData = data;
            corpo = w.slice(ini.i + ini.d.n, iv);
          } else if (cab && ultimaData && w[0].x0 > (cab.credito < cab.debito ? 0 : 0) && !ini) {
            data = ultimaData; // extratos que só escrevem a data no primeiro lançamento do dia
            corpo = w.slice(0, iv);
          } else return;

          var negSinal = false;
          if (corpo.length && SINAIS[corpo[corpo.length - 1].text]) { negSinal = true; corpo = corpo.slice(0, -1); }
          var desc = corpo.filter(function (x) {
            return x.text !== "R$" && x.text !== "US$" && !/^•+$/.test(x.text) && !/^\d{4}$/.test(x.text) && !/^\d{6,}$/.test(x.text);
          }).map(function (x) { return x.text; }).join(" ").replace(/\s+/g, " ").trim();
          if (R_RESUMO.test(norm(desc))) {
            if (/saldo anterior|saldo inicial/.test(norm(desc))) resumo.push({ txt: l.txt, t: "saldo anterior", vals: [valorDe(w[iv].text)] });
            return;
          }

          var vw = w[iv], valor = valorDe(vw.text);
          if (negSinal) valor = -Math.abs(valor);
          var marca = w[iv + 1] && /^[CD]$/.test(w[iv + 1].text) ? w[iv + 1].text : (/[CD]$/.test(vw.text) ? vw.text.slice(-1) : "");
          var saldoApos = null;

          if (tipo === "cartao") {
            valor = -valor; // compra impressa positiva = saída; pagamento/estorno negativo = entrada
          } else if (cab) {
            // cada número vai para a coluna mais próxima: crédito, débito ou saldo
            valor = null;
            w.slice(iv).forEach(function (x) {
              if (!ehValor(x.text)) return;
              var cx = (x.x0 + x.x1) / 2, v = Math.abs(valorDe(x.text));
              var dc = Math.abs(cx - cab.credito), dd = Math.abs(cx - cab.debito), ds = cab.saldo !== undefined ? Math.abs(cx - cab.saldo) : 1e9;
              if (ds < dc && ds < dd) saldoApos = valorDe(x.text);
              else if (valor === null) valor = dc < dd ? v : -v;
            });
            if (valor === null && saldoApos === null) return;
          } else {
            if (marca === "D") valor = -Math.abs(valor);
            if (marca === "C") valor = Math.abs(valor);
            var resto2 = w.slice(iv + 1).filter(function (x) { return ehValor(x.text); });
            if (resto2.length) saldoApos = valorDe(resto2[resto2.length - 1].text);
          }

          var parcela = null, m = R_PARC.exec(desc);
          if (m && +m[1] >= 1 && +m[1] <= +m[2] && +m[2] >= 2 && +m[2] <= 48) {
            parcela = { atual: +m[1], total: +m[2] };
            desc = desc.slice(0, desc.length - (m[1] + "/" + m[2]).length).replace(/[\s/]+$/, "").trim();
            if (!desc) desc = (corpo.map(function (x) { return x.text; }).join(" "));
          }
          if (!desc && !(tipo === "conta" && cab)) return;
          achados.push({ li: li, i: trans.length });
          trans.push({
            data: iso(data, ref), original: desc, descricao: desc, valor: valor === null ? null : Math.round(valor * 100) / 100,
            parcela: parcela, saldoApos: saldoApos, pagina: pi + 1, dica: null, tipoDoc: tipo
          });
        });

        // Linhas sem data e sem valor perto de um lançamento: continuação da descrição
        // (extratos de conta) ou ramo do comércio (algumas faturas trazem "ALIMENTAÇÃO .CIDADE").
        if (!achados.length) return;
        var usadas = {};
        achados.forEach(function (a) { usadas[a.li] = 1; });
        ls.forEach(function (l, li) {
          if (usadas[li]) return;
          if (l.w.some(function (x) { return ehValor(x.text); }) || dataNoInicio(l.w)) return;
          var melhor = null;
          achados.forEach(function (a) {
            var d = Math.abs(ls[a.li].top - l.top);
            if (d < 14 && (!melhor || d < melhor.d)) melhor = { d: d, a: a, acima: l.top < ls[a.li].top };
          });
          var t = norm(l.txt);
          var dica = Object.keys(HINTS).filter(function (h) { return t.indexOf(h) === 0; })[0];
          if (dica) {
            // o ramo do comércio vem logo abaixo do lançamento a que pertence
            var acima = null;
            achados.forEach(function (a) { var d = l.top - ls[a.li].top; if (d > 0 && d < 16 && (!acima || d < acima.d)) acima = { d: d, a: a }; });
            if (acima) trans[acima.a.i].dica = HINTS[dica];
            return;
          }
          if (!melhor) return;
          var tr = trans[melhor.a.i];
          if (tipo !== "conta" || /^data\b|historico|lancamento|descri/.test(t) || l.txt.length > 60) return;
          tr.original = (melhor.acima ? l.txt + " " + tr.original : tr.original + " " + l.txt).trim();
          tr.descricao = tr.original;
        });
      });
    });
    trans = trans.filter(function (t) { return t.original; });
    // Valor ilegível (comum em PDF escaneado) mas com saldo: calcula pela diferença de saldos
    var anterior = null;
    resumo.forEach(function (r) { if (/saldo anterior|saldo inicial/.test(r.t) && anterior === null) anterior = r.vals[r.vals.length - 1]; });
    var acum = 0;
    trans.forEach(function (t) {
      if (t.valor === null) {
        if (anterior !== null && t.saldoApos !== null) { t.valor = Math.round((t.saldoApos - anterior - acum) * 100) / 100; t.inferido = true; }
        else t.valor = 0, t.ilegivel = true;
      }
      acum += t.valor;
      if (t.saldoApos !== null && t.saldoApos !== undefined) { anterior = t.saldoApos; acum = 0; }
    });

    // Mês de competência: na fatura, o mês do vencimento; no extrato, o mês de cada lançamento
    var venc = /vencimento[\s\S]{0,90}?(\d{2})\/(\d{2})\/(\d{4})/.exec(tn) || /vencimento[\s\S]{0,40}?(\d{1,2}) (jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez) (\d{4})/.exec(tn);
    var mesFatura = venc ? venc[3] + "-" + String(MESES[String(venc[2]).toUpperCase()] || +venc[2]).padStart(2, "0") : null;
    trans.forEach(function (t) { t.competencia = tipo === "cartao" && mesFatura ? mesFatura : t.data.slice(0, 7); });

    var parte = /folha:?\s*(\d+)\s*\/\s*(\d+)/.exec(tn);
    var info = {
      tipo: tipo, banco: detectarBanco(todoTexto), transacoes: trans, referencia: ref, vencimento: mesFatura,
      parcial: parte && +parte[2] > paginas.length ? "O arquivo parece ser só parte do extrato (folha " + parte[1] + " de " + parte[2] + ")." : ""
    };
    info.conferencia = conferir(info, resumo);
    return info;
  }

  // ── Conferência dos totais ───────────────────────────────────
  function quase(a, b) { return Math.abs(a - b) < 0.015; }
  function conferir(info, resumo) {
    var tr = info.transacoes;
    if (!tr.length) return { ok: false, nivel: "erro", msg: "Nenhum lançamento encontrado neste arquivo." };
    if (info.tipo === "cartao") {
      var pagos = 0, liquido = 0;
      tr.forEach(function (t) {
        if (t.valor > 0 && R_PAGAMENTO.test(norm(t.original))) { t.pagamento = true; pagos += t.valor; }
        else liquido += -t.valor;
      });
      liquido = Math.round(liquido * 100) / 100;
      var cand = [];
      resumo.forEach(function (r) { r.vals.forEach(function (v) { cand.push({ v: Math.abs(v), txt: r.txt }); }); });
      var hit = cand.filter(function (c) { return quase(c.v, liquido); })[0];
      if (hit) return { ok: true, nivel: "ok", msg: "Total conferido com a fatura: " + brl(liquido) + ".", total: liquido };
      var ant = resumo.filter(function (r) { return /fatura anterior|saldo anterior/.test(r.t); })[0];
      if (ant) {
        var tot = Math.abs(ant.vals[ant.vals.length - 1]) + liquido - pagos;
        if (cand.some(function (c) { return quase(c.v, tot); })) return { ok: true, nivel: "ok", msg: "Total a pagar conferido com a fatura: " + brl(tot) + ".", total: liquido };
      }
      return { ok: false, nivel: "aviso", msg: "Não consegui achar o total da fatura para conferir. Some lida: " + brl(liquido) + ". Confira com o total impresso.", total: liquido };
    }
    // Conta: confere a sequência de saldos
    var s0 = resumo.filter(function (r) { return r.t === "saldo anterior" || /saldo anterior|saldo inicial/.test(r.t); })[0];
    var saldo = s0 ? s0.vals[s0.vals.length - 1] : null, pontos = 0, bons = 0, acumulado = 0, primeiraDif = null;
    tr.forEach(function (t) {
      acumulado += t.valor;
      if (t.saldoApos === null || t.saldoApos === undefined) return;
      if (saldo !== null) {
        pontos++;
        if (quase(saldo + acumulado, t.saldoApos)) bons++;
        else if (!primeiraDif) primeiraDif = t;
      }
      saldo = t.saldoApos; acumulado = 0;
    });
    var inf = tr.filter(function (t) { return t.inferido; }).length, ileg = tr.filter(function (t) { return t.ilegivel; }).length;
    var aviso = (info.parcial ? " " + info.parcial : "") + (inf ? " " + inf + (inf > 1 ? " valores ilegíveis foram calculados" : " valor ilegível foi calculado") + " pela diferença de saldo." : "") + (ileg ? " " + ileg + " valor(es) não puderam ser lidos." : "");
    if (pontos && bons === pontos) return { ok: !info.parcial, nivel: info.parcial ? "aviso" : "ok", msg: "Saldos conferidos em " + pontos + " de " + pontos + " pontos." + aviso };
    if (pontos) return { ok: false, nivel: "aviso", msg: "O saldo não bateu em " + (pontos - bons) + " de " + pontos + " pontos (primeiro em " + primeiraDif.data.split("-").reverse().join("/") + "). Pode faltar algum lançamento." + aviso };
    return { ok: false, nivel: "aviso", msg: "Este extrato não traz saldos para conferir. Confira o total com o banco." + aviso };
  }
  function brl(v) { return "R$ " + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // ── PDF escaneado: endireita a página torta ──────────────────
  // Recebe as linhas que o OCR encontrou (listas de palavras), mede a
  // inclinação média e corrige o "top" de cada palavra.
  function endireitar(words, linhasOCR) {
    var incl = [];
    (linhasOCR || []).forEach(function (l) {
      if (l.length < 3) return;
      var n = l.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
      l.forEach(function (w) { sx += w.x0; sy += w.top; sxx += w.x0 * w.x0; sxy += w.x0 * w.top; });
      var den = n * sxx - sx * sx;
      if (den > 0) { var m = (n * sxy - sx * sy) / den; if (Math.abs(m) < 0.08) incl.push(m); }
    });
    if (!incl.length) return words;
    incl.sort(function (a, b) { return a - b; });
    var m = incl[Math.floor(incl.length / 2)];
    words.forEach(function (w) { w.top = w.top - m * w.x0; });
    return words;
  }

  // ── OFX (quando o banco oferecer) ────────────────────────────
  function lerOFX(texto) {
    var trans = [], m, r = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi;
    function campo(b, k) { var x = new RegExp("<" + k + ">([^<\\r\\n]*)", "i").exec(b); return x ? x[1].trim() : ""; }
    while ((m = r.exec(texto))) {
      var b = m[1], d = campo(b, "DTPOSTED"), v = parseFloat(campo(b, "TRNAMT").replace(",", "."));
      var desc = campo(b, "MEMO") || campo(b, "NAME");
      if (!d || isNaN(v)) continue;
      trans.push({ data: d.slice(0, 4) + "-" + d.slice(4, 6) + "-" + d.slice(6, 8), original: desc, descricao: desc, valor: v, parcela: null, saldoApos: null, pagina: 1, dica: null, tipoDoc: /CREDITCARD/i.test(texto) ? "cartao" : "conta", competencia: d.slice(0, 4) + "-" + d.slice(4, 6) });
    }
    var tipo = /CREDITCARD/i.test(texto) ? "cartao" : "conta";
    return { tipo: tipo, banco: detectarBanco(texto), transacoes: trans, conferencia: { ok: true, nivel: "ok", msg: "Arquivo OFX: lançamentos lidos direto do banco." }, parcial: "" };
  }

  // ── CSV / planilha exportada: acha as colunas pelo conteúdo ───
  function lerCSV(texto) {
    var sep = (texto.split("\n")[0].match(/;/g) || []).length >= (texto.split("\n")[0].match(/,/g) || []).length ? ";" : ",";
    var rows = texto.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) {
      var out = [], cur = "", q = false;
      for (var i = 0; i < l.length; i++) { var ch = l[i]; if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = ""; } else cur += ch; }
      out.push(cur); return out.map(function (s) { return s.trim(); });
    });
    var nc = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    var nota = [];
    for (var c = 0; c < nc; c++) {
      var d = 0, v = 0, t = 0;
      rows.forEach(function (r) { var x = r[c] || ""; if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$|^\d{4}-\d{2}-\d{2}/.test(x)) d++; else if (/^-?R?\$?\s?-?[\d.]+,\d{2}$|^-?\d+\.\d{2}$/.test(x)) v++; else if (/[A-Za-z]/.test(x)) t++; });
      nota.push({ c: c, d: d, v: v, t: t });
    }
    var cd = nota.slice().sort(function (a, b) { return b.d - a.d; })[0].c;
    var cv = nota.slice().sort(function (a, b) { return b.v - a.v; })[0].c;
    var ct = nota.filter(function (n) { return n.c !== cd && n.c !== cv; }).sort(function (a, b) { return b.t - a.t; })[0];
    ct = ct ? ct.c : 1;
    var trans = [];
    rows.forEach(function (r) {
      var ds = r[cd] || "", vs = r[cv] || "";
      var dm = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/.exec(ds) || /^(\d{4})-(\d{2})-(\d{2})/.exec(ds);
      if (!dm) return;
      var data = /^\d{4}/.test(ds) ? ds.slice(0, 10) : ((dm[3] ? (dm[3].length === 2 ? "20" + dm[3] : dm[3]) : new Date().getFullYear()) + "-" + dm[2].padStart(2, "0") + "-" + dm[1].padStart(2, "0"));
      var v = /,\d{2}$/.test(vs) ? valorDe(vs) : parseFloat(vs.replace(/[^\d.-]/g, ""));
      if (isNaN(v)) return;
      trans.push({ data: data, original: r[ct] || "", descricao: r[ct] || "", valor: v, parcela: null, saldoApos: null, pagina: 1, dica: null, tipoDoc: "conta", competencia: data.slice(0, 7) });
    });
    return { tipo: "conta", banco: detectarBanco(texto), transacoes: trans, conferencia: { ok: false, nivel: "aviso", msg: "Planilha lida pelas colunas de data, descrição e valor. Confira o total." }, parcial: "" };
  }

  var api = { ler: ler, endireitar: endireitar, lerOFX: lerOFX, lerCSV: lerCSV, linhas: linhas, norm: norm, ehValor: ehValor, valorDe: valorDe, detectarBanco: detectarBanco, R_PAGAMENTO: R_PAGAMENTO };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.VHG_EXTRATOS_LEITOR = api;
})(this);
