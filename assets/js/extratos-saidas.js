// ─────────────────────────────────────────────────────────────
//  extratos-saidas.js — gera o .txt, o Excel e o PDF da análise
//  Tudo é montado no navegador e baixado direto. Nada é enviado.
// ─────────────────────────────────────────────────────────────
window.VHG_EXTRATOS_SAIDAS = (function () {
  "use strict";

  var C = window.VHG_EXTRATOS_CATEGORIAS;
  var LIBS = {
    exceljs: "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js",
    jspdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    autotable: "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"
  };
  var FONTES = {
    "Archivo|normal": "assets/marca/fontes/Archivo-Regular.ttf",
    "Archivo|bold": "assets/marca/fontes/Archivo-SemiBold.ttf",
    "Newsreader|normal": "assets/marca/fontes/Newsreader72pt-Light.ttf",
    "Newsreader|italic": "assets/marca/fontes/Newsreader72pt-LightItalic.ttf"
  };
  var scripts = {};
  function carregar(url) {
    if (!scripts[url]) scripts[url] = new Promise(function (ok, erro) {
      var s = document.createElement("script"); s.src = url; s.async = true; s.crossOrigin = "anonymous";
      s.onload = ok; s.onerror = function () { delete scripts[url]; erro(new Error("Não consegui carregar uma biblioteca. Verifique a internet e tente de novo.")); };
      document.head.appendChild(s);
    });
    return scripts[url];
  }

  var brl = C.brl, n1 = C.n1;
  function brlS(v) { return (v > 0 ? "+" : "") + brl(v); }
  function dataBR(iso) { var p = iso.split("-"); return p[2] + "/" + p[1] + "/" + p[0]; }
  function slug(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function nomeArquivo(d, ext) {
    var m = d.analise.meses, per = m.length ? (m.length === 1 ? m[0] : m[0] + "-a-" + m[m.length - 1]) : "";
    return ["analise", slug(d.cliente) || null, per].filter(Boolean).join("-") + "." + ext;
  }
  function semTags(h) { return String(h).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<"); }
  function tipoDoc(t) { return t === "cartao" ? "Fatura de cartão" : t === "conta" ? "Extrato de conta" : ""; }
  function hoje(d) { return d.geradoEm.toLocaleDateString("pt-BR"); }

  // ── .txt ──────────────────────────────────────────────────────
  function pad(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length); }
  function padL(s, n) { s = String(s); return " ".repeat(Math.max(0, n - s.length)) + s; }
  function txt(d) {
    var a = d.analise, W = 100, L = [];
    L.push("=".repeat(W), centro("ANÁLISE DE EXTRATOS · VERSÃO LIMPA", W), centro("VHG · Planejamento Financeiro", W), "=".repeat(W), "");
    if (d.cliente) L.push("Cliente ......: " + d.cliente);
    L.push("Período ......: " + d.periodo, "Gerado em ....: " + hoje(d), "");
    d.arquivos.forEach(function (f) { L.push("Arquivo ......: " + f.nome + "  (" + [tipoDoc(f.tipo), f.banco, f.n + " lançamentos"].filter(Boolean).join(" · ") + ")", "  Conferência: " + (f.conferencia ? f.conferencia.msg : "")); });
    L.push("");
    if (a.totalReceitas) L.push("Entradas .............. " + padL(brl(a.totalReceitas), 16));
    L.push("Gastos ................ " + padL(brl(a.totalGastos), 16));
    if (a.investido) L.push("Investido ............. " + padL(brl(a.investido), 16));
    if (a.totalEstornos) L.push("Estornos e créditos ... " + padL(brl(a.totalEstornos), 16));
    if (a.sobra !== null) L.push("Sobra ................. " + padL(brl(a.sobra), 16));
    L.push("", "-".repeat(W), pad("DATA", 12) + pad("DESCRIÇÃO", 44) + pad("CATEGORIA", 22) + padL("VALOR", 22), "-".repeat(W));
    d.trans.forEach(function (t) {
      L.push(pad(dataBR(t.data), 12) + pad(t.descricao + (t.parcela ? " (" + t.parcela.atual + "/" + t.parcela.total + ")" : ""), 44) + pad(t.categoria, 22) + padL(brlS(t.valor), 22));
    });
    L.push("-".repeat(W), "", "GASTOS POR CATEGORIA", "-".repeat(W));
    a.cats.forEach(function (c) { L.push(pad(c.categoria, 26) + padL(c.n + " lanç.", 10) + padL(brl(c.total), 20) + padL(n1(c.pct) + "% dos gastos", 20)); });
    L.push("-".repeat(W), pad("Total de gastos", 36) + padL(brl(a.totalGastos), 20), "");
    if (a.parcelas.length) {
      L.push("COMPRAS PARCELADAS (o que ainda falta pagar)", "-".repeat(W));
      a.parcelas.forEach(function (p) { L.push(pad(p.t.descricao, 46) + pad(p.t.parcela.atual + " de " + p.t.parcela.total, 12) + padL(brl(-p.t.valor), 18) + padL(brl(p.restante), 20)); });
      L.push("-".repeat(W), pad("Total a vencer", 76) + padL(brl(a.totalParcelasFuturas), 20), "");
    }
    L.push("Arquivo gerado no navegador. Os extratos originais não foram enviados nem salvos em nenhum servidor.", "=".repeat(W));
    return { blob: new Blob(["﻿" + L.join("\r\n") + "\r\n"], { type: "text/plain;charset=utf-8" }), nome: nomeArquivo(d, "txt") };
  }
  function centro(s, w) { var e = Math.max(0, Math.floor((w - s.length) / 2)); return " ".repeat(e) + s; }

  // ── Excel ─────────────────────────────────────────────────────
  async function xlsx(d) {
    await carregar(LIBS.exceljs);
    var a = d.analise, wb = new window.ExcelJS.Workbook();
    wb.creator = "VHG · Planejamento Financeiro"; wb.created = d.geradoEm;
    var PET = "FF123B47", MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"-"', PCT = "0.0%";
    var fH = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" }, size: 10 }, fill = { type: "pattern", pattern: "solid", fgColor: { argb: PET } };
    var fT = { name: "Arial", size: 16, color: { argb: PET } }, fS = { name: "Arial", size: 9, color: { argb: "FF6B6358" } }, fB = { name: "Arial", size: 10 }, fN = { name: "Arial", size: 10, bold: true, color: { argb: PET } };
    var borda = { bottom: { style: "thin", color: { argb: "FFDCD4C6" } } };
    function cab(ws, row, cols) {
      var r = ws.getRow(row);
      cols.forEach(function (c, i) { var x = r.getCell(i + 1); x.value = c; x.font = fH; x.fill = fill; x.alignment = { horizontal: "center", vertical: "middle" }; });
      r.height = 22;
    }
    var wsR = wb.addWorksheet("Resumo", { views: [{ showGridLines: false }] });
    var wsC = wb.addWorksheet("Por categoria");
    var wsT = wb.addWorksheet("Lançamentos");
    var wsP = a.parcelas.length ? wb.addWorksheet("Parcelas") : null;
    var wsG = wb.addWorksheet("Regras");

    // Lançamentos
    wsT.getCell("A1").value = "Lançamentos · " + d.periodo; wsT.getCell("A1").font = fT;
    wsT.getCell("A2").value = (d.cliente ? d.cliente + " · " : "") + d.arquivos.map(function (f) { return f.banco || f.nome; }).join(", "); wsT.getCell("A2").font = fS;
    cab(wsT, 4, ["Data", "Descrição", "Categoria", "Documento", "Banco", "Mês", "Parcela", "Valor"]);
    var r0 = 5;
    d.trans.forEach(function (t, i) {
      var f = d.arquivos[t.arquivo] || {}, p = t.data.split("-");
      var row = wsT.getRow(r0 + i);
      row.values = [new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])), t.descricao, t.categoria, tipoDoc(f.tipo), f.banco || "", t.competencia, t.parcela ? t.parcela.atual + "/" + t.parcela.total : "", t.valor];
      row.eachCell({ includeEmpty: true }, function (c) { c.font = fB; c.border = borda; });
      row.getCell(1).numFmt = "dd/mm/yyyy"; row.getCell(8).numFmt = MOEDA;
      if (t.categoria === "A revisar") row.eachCell({ includeEmpty: true }, function (c) { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4D6" } }; });
    });
    var rN = r0 + Math.max(0, d.trans.length - 1);
    [12, 42, 22, 18, 14, 10, 9, 15].forEach(function (w, i) { wsT.getColumn(i + 1).width = w; });
    wsT.views = [{ state: "frozen", ySplit: 4 }];
    wsT.autoFilter = { from: "A4", to: "H" + rN };
    var CAT = "'Lançamentos'!$C$" + r0 + ":$C$" + rN, VAL = "'Lançamentos'!$H$" + r0 + ":$H$" + rN;

    // Por categoria
    wsC.getCell("A1").value = "Gastos por categoria"; wsC.getCell("A1").font = fT;
    wsC.getCell("A2").value = "Calculado a partir da aba Lançamentos. Troque uma categoria lá e tudo aqui se atualiza."; wsC.getCell("A2").font = fS;
    cab(wsC, 4, ["Categoria", "Lançamentos", "Total", "% dos gastos"]);
    var rt = 5 + a.cats.length;
    a.cats.forEach(function (c, i) {
      var r = 5 + i, row = wsC.getRow(r);
      row.getCell(1).value = c.categoria;
      row.getCell(2).value = { formula: 'COUNTIFS(' + CAT + ',A' + r + ',' + VAL + ',"<0")', result: c.n };
      row.getCell(3).value = { formula: '-SUMIFS(' + VAL + ',' + CAT + ',A' + r + ',' + VAL + ',"<0")', result: c.total };
      row.getCell(4).value = { formula: 'IF($C$' + rt + '=0,0,C' + r + '/$C$' + rt + ')', result: c.pct / 100 };
      row.getCell(3).numFmt = MOEDA; row.getCell(4).numFmt = PCT;
      row.eachCell(function (x) { x.font = fB; x.border = borda; });
    });
    var tot = wsC.getRow(rt);
    tot.getCell(1).value = "Total de gastos";
    tot.getCell(2).value = { formula: "SUM(B5:B" + (rt - 1) + ")", result: a.nGastos };
    tot.getCell(3).value = { formula: "SUM(C5:C" + (rt - 1) + ")", result: a.totalGastos }; tot.getCell(3).numFmt = MOEDA;
    tot.getCell(4).value = { formula: "SUM(D5:D" + (rt - 1) + ")", result: 1 }; tot.getCell(4).numFmt = PCT;
    tot.eachCell(function (x) { x.font = fN; });
    [26, 13, 16, 14].forEach(function (w, i) { wsC.getColumn(i + 1).width = w; });

    // Resumo
    wsR.getCell("B2").value = "Análise de extratos · " + d.periodo; wsR.getCell("B2").font = { name: "Arial", size: 18, color: { argb: PET } };
    wsR.getCell("B3").value = (d.cliente ? d.cliente + " · " : "") + "gerado em " + hoje(d); wsR.getCell("B3").font = fS;
    wsR.getCell("B5").value = "NÚMEROS DO PERÍODO"; wsR.getCell("B5").font = { name: "Arial", size: 9, bold: true, color: { argb: "FFC08A4E" } };
    var linhas = [
      ["Entradas (receitas)", 'SUMIFS(' + VAL + ',' + CAT + ',"Receitas")', a.totalReceitas, MOEDA],
      ["Gastos", "'Por categoria'!C" + rt, a.totalGastos, MOEDA],
      ["Investido", '-SUMIFS(' + VAL + ',' + CAT + ',"Investimentos")', a.investido, MOEDA],
      ["Estornos e créditos", 'SUMIFS(' + VAL + ',' + CAT + ',"Estornos e créditos")', a.totalEstornos, MOEDA],
      ["Sobra (entradas − gastos)", 'IF(C6=0,"",C6-C7)', a.sobra === null ? "" : a.sobra, MOEDA],
      ["Taxa de poupança", 'IF(C6=0,"",C10/C6)', a.totalReceitas ? a.sobra / a.totalReceitas : "", PCT],
      ["Assinaturas no período", '-SUMIFS(' + VAL + ',' + CAT + ',"Assinaturas")', a.totalAssinaturas, MOEDA],
      ["Parcelas ainda a vencer", wsP ? "Parcelas!E" + (5 + a.parcelas.length) : "0", a.totalParcelasFuturas, MOEDA],
      ["Lançamentos a revisar", 'COUNTIF(' + CAT + ',"A revisar")', a.revisar.length, "0"]
    ];
    linhas.forEach(function (l, i) {
      var r = 6 + i, row = wsR.getRow(r);
      row.getCell(2).value = l[0]; row.getCell(2).font = fB; row.getCell(2).border = borda;
      row.getCell(3).value = { formula: l[1], result: l[2] }; row.getCell(3).numFmt = l[3]; row.getCell(3).font = fN; row.getCell(3).border = borda;
    });
    var r = 17;
    wsR.getCell("B" + r).value = "ARQUIVOS LIDOS"; wsR.getCell("B" + r).font = { name: "Arial", size: 9, bold: true, color: { argb: "FFC08A4E" } };
    d.arquivos.forEach(function (f, i) {
      wsR.getCell("B" + (r + 1 + i)).value = f.nome; wsR.getCell("B" + (r + 1 + i)).font = fB;
      wsR.getCell("C" + (r + 1 + i)).value = [tipoDoc(f.tipo), f.banco, f.n + " lançamentos", f.conferencia ? f.conferencia.msg : ""].filter(Boolean).join(" · "); wsR.getCell("C" + (r + 1 + i)).font = fS;
    });
    var rr = r + 2 + d.arquivos.length;
    wsR.getCell("B" + rr).value = "As fórmulas leem a aba Lançamentos: se uma categoria for corrigida lá, o resumo se atualiza sozinho."; wsR.getCell("B" + rr).font = fS;
    wsR.getCell("B" + (rr + 1)).value = "Gerado no navegador: os extratos originais não foram enviados nem salvos em nenhum servidor."; wsR.getCell("B" + (rr + 1)).font = fS;
    wsR.getColumn(1).width = 3; wsR.getColumn(2).width = 30; wsR.getColumn(3).width = 20;

    // Parcelas
    if (wsP) {
      wsP.getCell("A1").value = "Compras parceladas"; wsP.getCell("A1").font = fT;
      wsP.getCell("A2").value = "O que ainda vai aparecer nas próximas faturas."; wsP.getCell("A2").font = fS;
      cab(wsP, 4, ["Compra", "Parcela atual", "Total de parcelas", "Valor da parcela", "Falta pagar"]);
      a.parcelas.forEach(function (p, i) {
        var rw = wsP.getRow(5 + i), n = 5 + i;
        rw.values = [p.t.descricao, p.t.parcela.atual, p.t.parcela.total, -p.t.valor];
        rw.getCell(5).value = { formula: "(C" + n + "-B" + n + ")*D" + n, result: p.restante };
        rw.getCell(4).numFmt = MOEDA; rw.getCell(5).numFmt = MOEDA;
        rw.eachCell(function (x) { x.font = fB; x.border = borda; });
      });
      var tp = wsP.getRow(5 + a.parcelas.length);
      tp.getCell(1).value = "Total"; tp.getCell(5).value = { formula: "SUM(E5:E" + (4 + a.parcelas.length) + ")", result: a.totalParcelasFuturas }; tp.getCell(5).numFmt = MOEDA;
      tp.eachCell(function (x) { x.font = fN; });
      [40, 14, 16, 16, 16].forEach(function (w, i) { wsP.getColumn(i + 1).width = w; });
    }

    // Regras
    wsG.getCell("A1").value = "Regras de categoria"; wsG.getCell("A1").font = fT;
    wsG.getCell("A2").value = "Se a descrição do banco tem a palavra-chave, o lançamento vai para a categoria. Primeiro as suas, depois as prontas."; wsG.getCell("A2").font = fS;
    cab(wsG, 4, ["Palavra-chave", "Categoria", "Origem"]);
    d.regras.map(function (x) { return [x[0], x[1], "Sua regra"]; }).concat(C.REGRAS.map(function (x) { return [x[0], x[1], "Pronta"]; })).forEach(function (x, i) {
      var rw = wsG.getRow(5 + i); rw.values = x; rw.eachCell(function (c) { c.font = fB; });
    });
    [28, 24, 12].forEach(function (w, i) { wsG.getColumn(i + 1).width = w; });

    var buf = await wb.xlsx.writeBuffer();
    return { blob: new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), nome: nomeArquivo(d, "xlsx") };
  }

  // ── PDF no visual VHG ─────────────────────────────────────────
  var PET = [18, 59, 71], PET2 = [11, 37, 48], COB = [192, 138, 78], COB2 = [212, 155, 92], PAP = [242, 237, 228], PAP2 = [251, 249, 245], LIN = [220, 212, 198], LIN2 = [237, 231, 220], T2 = [72, 83, 79], T3 = [107, 99, 88], T4 = [138, 129, 117];

  async function base64(url) {
    var r = await fetch(url);
    if (!r.ok) throw new Error("fonte");
    var b = new Uint8Array(await r.arrayBuffer()), s = "";
    for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  var cacheFontes = null;
  async function fontes(doc) {
    try {
      if (!cacheFontes) {
        cacheFontes = {};
        var ks = Object.keys(FONTES);
        var bs = await Promise.all(ks.map(function (k) { return base64(FONTES[k]); }));
        ks.forEach(function (k, i) { cacheFontes[k] = bs[i]; });
      }
      Object.keys(cacheFontes).forEach(function (k) {
        var p = k.split("|"), arq = p[0] + "-" + p[1] + ".ttf";
        doc.addFileToVFS(arq, cacheFontes[k]); doc.addFont(arq, p[0], p[1]);
      });
      return { sans: "Archivo", serif: "Newsreader" };
    } catch (e) { cacheFontes = null; return { sans: "helvetica", serif: "times" }; }
  }

  async function pdf(d) {
    await carregar(LIBS.jspdf);
    await carregar(LIBS.autotable);
    var jsPDF = window.jspdf.jsPDF, a = d.analise;
    var doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    var F = await fontes(doc);
    var W = 210, H = 297, M = 18, CW = W - 2 * M;
    doc.setProperties({ title: "Análise de gastos" + (d.cliente ? " · " + d.cliente : ""), author: "VHG · Planejamento Financeiro", creator: "VHG" });
    function cor(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function fundo(c) { doc.setFillColor(c[0], c[1], c[2]); }
    function traco(c) { doc.setDrawColor(c[0], c[1], c[2]); }
    function fonte(f, s, estilo) { doc.setFont(f, estilo || "normal"); doc.setFontSize(s); }
    function espacado(txt, x, y, esp, alinhar) {
      // letras espaçadas, como os "eyebrows" do site
      var w = 0, i, chars = txt.split("");
      chars.forEach(function (ch) { w += doc.getTextWidth(ch) + esp; });
      var x0 = alinhar === "right" ? x - w : x;
      for (i = 0; i < chars.length; i++) { doc.text(chars[i], x0, y); x0 += doc.getTextWidth(chars[i]) + esp; }
    }
    var y = 0;
    function novaPagina() { doc.addPage(); y = 26; } // páginas internas brancas: imprimem melhor
    function precisa(h) { if (y + h > H - 22) novaPagina(); }
    function eyebrow(t) { traco(COB); doc.setLineWidth(0.3); doc.line(M, y - 1.1, M + 8, y - 1.1); fonte(F.sans, 7, "normal"); cor(COB); espacado(t.toUpperCase(), M + 11, y, 0.9); y += 8; }
    function titulo(t, tam) { fonte(F.serif, tam || 24); cor(PET); var ls = doc.splitTextToSize(t, CW); doc.text(ls, M, y + 2); y += ls.length * (tam || 24) * 0.42 + 6; }
    function para(t, tam, c) { fonte(F.sans, tam || 9.5); cor(c || T2); var ls = doc.splitTextToSize(t, CW); doc.text(ls, M, y, { lineHeightFactor: 1.55 }); y += ls.length * (tam || 9.5) * 0.353 * 1.55 + 3; }
    function caixa(x, yy, w, h, c, borda) { fundo(c); if (borda) { traco(borda); doc.setLineWidth(0.2); doc.roundedRect(x, yy, w, h, 4, 4, "FD"); } else doc.roundedRect(x, yy, w, h, 4, 4, "F"); }
    function tabela(head, body, opts) {
      doc.autoTable(Object.assign({
        head: [head], body: body, startY: y, margin: { left: M, right: M, top: 26, bottom: 22 }, theme: "plain",
        styles: { font: F.sans, fontSize: 8.4, textColor: T2, cellPadding: { top: 2, bottom: 2, left: 0, right: 2.5 }, lineColor: LIN2, lineWidth: { bottom: 0.2 }, overflow: "linebreak" },
        headStyles: { font: F.sans, fontStyle: "normal", fontSize: 6.6, textColor: T4, lineColor: LIN, lineWidth: { bottom: 0.3 }, cellPadding: { top: 1, bottom: 2.4, left: 0, right: 2.5 } },
        willDrawPage: function () { }, didDrawPage: function () { }
      }, opts || {}));
      y = doc.lastAutoTable.finalY + 8;
    }
    function dir(i) { var o = {}; o[i] = { halign: "right", fontStyle: "bold", textColor: PET2 }; return o; }

    // 1 · capa
    fundo(PET); doc.rect(0, 0, W, H, "F");
    traco([40, 80, 92]); doc.setLineWidth(0.25); doc.circle(W - 10, 18, 70, "S");
    fonte(F.serif, 17); cor(PAP); doc.text("VHG", 22, 30);
    fonte(F.sans, 6); cor([200, 196, 188]); espacado("PLANEJAMENTO FINANCEIRO", 39, 29.6, 0.9);
    y = 118;
    traco(COB2); doc.line(22, y - 1.1, 30, y - 1.1); fonte(F.sans, 7.5); cor(COB2); espacado("ANÁLISE DE GASTOS", 33, y, 1);
    fonte(F.serif, 40); cor(PAP); doc.text(["Para onde foi", "o seu dinheiro"], 22, y + 18, { lineHeightFactor: 1.1 });
    y += 52;
    if (d.cliente) { fonte(F.serif, 21); cor(PAP); doc.text(d.cliente, 22, y); y += 10; }
    fonte(F.sans, 10); cor([205, 205, 198]);
    var bancos = d.arquivos.map(function (f) { return [tipoDoc(f.tipo), f.banco].filter(Boolean).join(" · "); }).filter(Boolean);
    doc.text(doc.splitTextToSize(cap(d.periodo) + (bancos.length ? "\n" + uniq(bancos).join("  ·  ") : ""), 160), 22, y, { lineHeightFactor: 1.6 });
    traco([60, 95, 106]); doc.line(22, H - 26, W - 22, H - 26);
    fonte(F.sans, 7.5); cor([175, 180, 178]); doc.text("Vitor Hugo Germano · Planejamento Financeiro", 22, H - 20); doc.text("Documento educacional e orientativo", W - 22, H - 20, { align: "right" });

    // 2 · resumo
    novaPagina();
    eyebrow("Resumo");
    if (a.modoRenda) titulo("Entrou " + brl(a.totalReceitas).replace(/,\d\d$/, "") + ". " + (a.sobra >= 0 ? "Sobrou " + n1(a.sobra / a.totalReceitas * 100) + "%." : "Faltou " + brl(-a.sobra).replace(/,\d\d$/, "") + "."));
    else titulo(brl(a.totalGastos).replace(/,\d\d$/, "") + " em gastos" + (a.meses.length > 1 ? ", " + brl(a.mediaMensalGastos).replace(/,\d\d$/, "") + " por mês" : "") + ".");
    para("Este resumo foi montado a partir " + (d.arquivos.length > 1 ? "dos " + d.arquivos.length + " documentos enviados" : "do documento enviado") + ", referente a " + d.periodo + ". Cada lançamento foi colocado numa categoria para mostrar, de uma vez, para onde foi o dinheiro.");
    y += 2;
    var ks = a.modoRenda
      ? [["ENTRADAS", brl(a.totalReceitas), "Salário, PIX e depósitos"], ["GASTOS", brl(a.totalGastos), n1(a.totalGastos / a.totalReceitas * 100) + "% do que entrou"], ["INVESTIDO", brl(a.investido), "Aplicações no período"], ["SOBRA", brl(a.sobra), n1(a.sobra / a.totalReceitas * 100) + "% da renda · referência: 20%", 1]]
      : [["GASTOS", brl(a.totalGastos), a.nGastos + " lançamentos"], ["ESTORNOS E CRÉDITOS", brl(a.totalEstornos), "Devoluções e créditos"], ["PARCELAS A VENCER", brl(a.totalParcelasFuturas), a.parcelas.length + " compras parceladas"], ["ASSINATURAS", brl(a.totalAssinaturas / Math.max(1, a.meses.length)), "por mês", 1]];
    var kw = (CW - 5) / 2;
    ks.forEach(function (k, i) {
      var x = M + (i % 2) * (kw + 5), yy = y + Math.floor(i / 2) * 27;
      caixa(x, yy, kw, 23, k[3] ? PET : PAP, null);
      fonte(F.sans, 6.4); cor(k[3] ? COB2 : T4); espacado(k[0], x + 6, yy + 7, 0.7);
      fonte(F.serif, 18); cor(k[3] ? PAP : PET); doc.text(k[1], x + 6, yy + 15.5);
      fonte(F.sans, 7.5); cor(k[3] ? [200, 205, 200] : T3); doc.text(k[2], x + 6, yy + 20);
    });
    y += 58;
    // conferência
    var conf = d.arquivos.map(function (f) { return (f.conferencia && f.conferencia.nivel === "ok" ? "✓ " : "! ") + f.nome + ": " + (f.conferencia ? f.conferencia.msg : ""); });
    fonte(F.sans, 8);
    var confL = doc.splitTextToSize(conf.join("\n"), CW - 12);
    var hConf = confL.length * 4 + 14;
    caixa(M, y, CW, hConf, PAP, null);
    fonte(F.sans, 6.4); cor(T4); espacado("CONFERÊNCIA DA LEITURA", M + 6, y + 7, 0.7);
    fonte(F.sans, 8); cor(T2); doc.text(confL.map(function (s) { return s.replace(/^✓ /, "OK  ").replace(/^! /, "!   "); }), M + 6, y + 12.5, { lineHeightFactor: 1.4 });
    y += hConf + 8;
    // barras
    precisa(20 + Math.min(a.cats.length, 12) * 7);
    fonte(F.serif, 15); cor(PET); doc.text("Para onde foi o dinheiro", M, y); y += 7;
    var maxC = a.cats[0] ? a.cats[0].total : 1;
    a.cats.slice(0, 12).forEach(function (c) {
      fonte(F.sans, 8.6); cor(T2); doc.text(c.categoria, M, y + 2.6);
      var bx = M + 42, bw = CW - 42 - 44, w = Math.max(0.6, c.total / maxC * bw);
      fundo(c.categoria === "A revisar" ? COB : PET); doc.rect(bx, y, w, 3.2, "F");
      fonte(F.sans, 8.6, "bold"); cor(PET2); doc.text(brl(c.total), M + CW - 13, y + 2.6, { align: "right" });
      fonte(F.sans, 8); cor(T4); doc.text(n1(c.pct) + "%", M + CW, y + 2.6, { align: "right" });
      y += 6.6;
    });
    if (a.cats.length > 12) { fonte(F.sans, 8); cor(T4); doc.text("+ " + (a.cats.length - 12) + " categorias menores na tabela da próxima página.", M, y + 2); }

    // 3 · categorias e destaques
    novaPagina();
    eyebrow("Categorias");
    titulo("Gastos por categoria");
    tabela(["CATEGORIA", "LANÇAMENTOS", "TOTAL", "% DOS GASTOS"].concat(a.modoRenda ? ["% DA RENDA"] : []),
      a.cats.map(function (c) { return [c.categoria, String(c.n), brl(c.total), n1(c.pct) + "%"].concat(a.modoRenda ? [n1(c.pctRenda) + "%"] : []); })
        .concat([["Total", String(a.nGastos), brl(a.totalGastos), "100%"].concat(a.modoRenda ? [n1(a.totalGastos / a.totalReceitas * 100) + "%"] : [])]),
      { columnStyles: { 1: { halign: "right" }, 2: { halign: "right", fontStyle: "bold", textColor: PET2 }, 3: { halign: "right" }, 4: { halign: "right" } },
        didParseCell: function (h) { if (h.section === "head" && h.column.index > 0) h.cell.styles.halign = "right"; if (h.section === "body" && h.row.index === a.cats.length) { h.cell.styles.fontStyle = "bold"; h.cell.styles.textColor = PET; h.cell.styles.lineWidth = 0; } } });
    if (a.destaques.length) {
      precisa(30);
      eyebrow("Destaques");
      titulo("O que chama atenção", 18);
      var cw2 = (CW - 5) / 2, col = 0, linhaY = y, alturaLinha = 0;
      a.destaques.forEach(function (dd) {
        fonte(F.sans, 8.4);
        var ls = doc.splitTextToSize(semTags(dd.h), cw2 - 10), h = ls.length * 4.1 + 14;
        if (col === 0) { if (linhaY + h > H - 24) { novaPagina(); linhaY = y; } alturaLinha = h; }
        else alturaLinha = Math.max(alturaLinha, h);
        var x = M + col * (cw2 + 5);
        caixa(x, linhaY, cw2, h, PAP, null);
        fonte(F.sans, 6.4, "bold"); cor(COB); espacado(dd.t, x + 5, linhaY + 7, 0.6);
        fonte(F.sans, 8.4); cor(T2); doc.text(ls, x + 5, linhaY + 12.5, { lineHeightFactor: 1.45 });
        col++;
        if (col === 2) { col = 0; linhaY += alturaLinha + 5; }
      });
      y = linhaY + (col ? alturaLinha + 5 : 0) + 4;
    }

    // 4 · compromissos
    if (y > 90) novaPagina(); else y += 4;
    eyebrow("Compromissos");
    titulo("Contas fixas, assinaturas e parcelas");
    if (a.recorrentes.length) {
      para("As contas que se repetem todo mês somam " + brl(a.totalRecorrentes / Math.max(1, a.meses.length)) + " por mês. É o valor que já está comprometido antes de qualquer escolha.");
      tabela(["DESCRIÇÃO", "CATEGORIA", "VALOR"], a.recorrentes.map(function (t) { return [t.descricao, t.categoria, brl(-t.valor)]; }), { columnStyles: dir(2), didParseCell: hd([2]) });
    }
    if (a.parcelas.length) {
      precisa(30);
      fonte(F.serif, 15); cor(PET); doc.text("Compras parceladas", M, y); y += 6;
      para("Ainda faltam " + brl(a.totalParcelasFuturas) + " em parcelas nas próximas faturas.");
      tabela(["COMPRA", "PARCELA", "VALOR", "FALTA PAGAR"], a.parcelas.map(function (p) { return [p.t.descricao, p.t.parcela.atual + " de " + p.t.parcela.total, brl(-p.t.valor), brl(p.restante)]; }),
        { columnStyles: Object.assign(dir(3), { 2: { halign: "right" } }), didParseCell: hd([2, 3]) });
    }
    precisa(30);
    fonte(F.serif, 15); cor(PET); doc.text("Maiores gastos", M, y); y += 6;
    tabela(["DATA", "DESCRIÇÃO", "CATEGORIA", "VALOR"], a.top.map(function (t) { return [dataBR(t.data), t.descricao, t.categoria, brl(-t.valor)]; }), { columnStyles: dir(3), didParseCell: hd([3]) });

    // 5 · todas as movimentações
    novaPagina();
    eyebrow("Extrato completo");
    titulo("Todas as movimentações", 20);
    tabela(["DATA", "DESCRIÇÃO", "CATEGORIA", "VALOR"].concat(d.arquivos.length > 1 ? ["ORIGEM"] : []),
      d.trans.map(function (t) {
        var f = d.arquivos[t.arquivo] || {};
        return [dataBR(t.data), t.descricao + (t.parcela ? " (" + t.parcela.atual + "/" + t.parcela.total + ")" : ""), t.categoria, brlS(t.valor)].concat(d.arquivos.length > 1 ? [(f.banco || "") + (f.tipo === "cartao" ? " cartão" : " conta")] : []);
      }),
      { styles: { font: F.sans, fontSize: 7.6, textColor: T2, cellPadding: { top: 1.5, bottom: 1.5, left: 0, right: 2.5 }, lineColor: LIN2, lineWidth: { bottom: 0.2 } },
        columnStyles: Object.assign(dir(3), { 0: { cellWidth: 19 }, 2: { textColor: T4 } }), didParseCell: function (h) { hd([3])(h); if (h.section === "body" && h.column.index === 3 && /^\+/.test(h.cell.raw)) h.cell.styles.textColor = [47, 107, 76]; } });

    // Cabeçalho e rodapé em todas as páginas, menos a capa
    var total = doc.getNumberOfPages();
    for (var p = 2; p <= total; p++) {
      doc.setPage(p);
      fonte(F.serif, 10.5); cor(PET); doc.text("VHG", M, 12.5);
      fonte(F.sans, 6.3); cor(T4); espacado(("ANÁLISE DE GASTOS · " + d.periodo).toUpperCase(), M + 11, 12.2, 0.6);
      if (d.cliente) espacado(d.cliente.toUpperCase(), W - M, 12.2, 0.6, "right");
      traco(LIN); doc.setLineWidth(0.2); doc.line(M, H - 15, W - M, H - 15);
      fonte(F.sans, 6.6); cor(T4);
      doc.text("Gerado no navegador em " + hoje(d) + ". Os extratos não foram enviados nem armazenados.", M, H - 10.5);
      doc.text(String(p).padStart(2, "0") + " · " + String(total).padStart(2, "0"), W - M, H - 10.5, { align: "right" });
    }
    return { blob: doc.output("blob"), nome: nomeArquivo(d, "pdf") };
  }
  function hd(cols) { return function (h) { if (h.section === "head" && cols.indexOf(h.column.index) >= 0) h.cell.styles.halign = "right"; }; }
  function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
  function uniq(l) { var o = []; l.forEach(function (x) { if (o.indexOf(x) < 0) o.push(x); }); return o; }

  return { txt: txt, xlsx: xlsx, pdf: pdf };
})();
