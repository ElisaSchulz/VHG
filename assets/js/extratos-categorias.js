// ─────────────────────────────────────────────────────────────
//  extratos-categorias.js — categorias, regras e análise
//
//  Regra = palavra-chave → categoria. As regras prontas ficam
//  aqui; as que o Vitor cria ficam só no navegador dele
//  (localStorage), e são só palavras, nunca valores ou dados.
// ─────────────────────────────────────────────────────────────
(function (root) {
  "use strict";

  var CATEGORIAS = [
    "Moradia", "Mercado", "Alimentação fora", "Transporte", "Saúde", "Educação", "Assinaturas",
    "Compras", "Cuidados pessoais", "Lazer e viagens", "Pets", "Seguros", "Impostos e taxas",
    "Tarifas e juros", "Transferências", "Saques", "Investimentos", "Outros",
    "Receitas", "Estornos e créditos", "Pagamento de fatura", "A revisar"
  ];
  // Categorias que não são gasto do mês
  var NAO_GASTO = { "Receitas": 1, "Investimentos": 1, "Pagamento de fatura": 1, "Estornos e créditos": 1 };

  // Ordem importa: as mais específicas primeiro.
  var REGRAS = [
    // não são gasto
    ["PAGAMENTO DE FATURA", "Pagamento de fatura"], ["PAG FATURA", "Pagamento de fatura"], ["PAGTO FATURA", "Pagamento de fatura"],
    ["PAGAMENTO EM", "Pagamento de fatura"], ["PAGAMENTO RECEBIDO", "Pagamento de fatura"], ["PAGAMENTO EFETUADO", "Pagamento de fatura"],
    ["PAGTO CARTAO", "Pagamento de fatura"], ["PAG CARTAO", "Pagamento de fatura"], ["FATURA CARTAO", "Pagamento de fatura"], ["CARTAO DE CREDITO", "Pagamento de fatura"],
    ["ESTORNO", "Estornos e créditos"], ["CASHBACK", "Estornos e créditos"], ["REEMBOLSO", "Estornos e créditos"], ["CREDITO DE", "Estornos e créditos"],
    ["SALARIO", "Receitas"], ["PROVENTO", "Receitas"], ["FOLHA DE PAGAMENTO", "Receitas"], ["PIX RECEBIDO", "Receitas"], ["TED RECEBIDA", "Receitas"],
    ["TRANSF RECEBIDA", "Receitas"], ["TRANSFERENCIA RECEBIDA", "Receitas"], ["DEPOSITO", "Receitas"], ["RENDIMENTO", "Receitas"], ["RESGATE", "Investimentos"],
    ["APLICACAO", "Investimentos"], ["CDB", "Investimentos"], ["TESOURO", "Investimentos"], ["CORRETORA", "Investimentos"], ["INVEST", "Investimentos"], ["POUPANCA", "Investimentos"],
    // assinaturas e serviços digitais
    ["NETFLIX", "Assinaturas"], ["SPOTIFY", "Assinaturas"], ["DISNEY", "Assinaturas"], ["AMAZON PRIME", "Assinaturas"], ["AMAZONPRIME", "Assinaturas"], ["PRIME VIDEO", "Assinaturas"],
    ["KINDLE", "Assinaturas"], ["HBO", "Assinaturas"], ["MAX.COM", "Assinaturas"], ["GLOBOPLAY", "Assinaturas"], ["PARAMOUNT", "Assinaturas"], ["DEEZER", "Assinaturas"],
    ["YOUTUBE", "Assinaturas"], ["GOOGLE ONE", "Assinaturas"], ["GOOGLE*ONE", "Assinaturas"], ["APPLE.COM", "Assinaturas"], ["ICLOUD", "Assinaturas"], ["MICROSOFT", "Assinaturas"],
    ["ADOBE", "Assinaturas"], ["CANVA", "Assinaturas"], ["OPENAI", "Assinaturas"], ["CHATGPT", "Assinaturas"], ["DROPBOX", "Assinaturas"], ["CRUNCHYROLL", "Assinaturas"],
    ["IFOOD CLUB", "Assinaturas"], ["SMILES CLUBE", "Assinaturas"], ["CLUBE SMILES", "Assinaturas"], ["NUBANK CROMA", "Assinaturas"], ["TELECINE", "Assinaturas"], ["STAR+", "Assinaturas"],
    // moradia e contas da casa
    ["ALUGUEL", "Moradia"], ["CONDOMINIO", "Moradia"], ["QUINTOANDAR", "Moradia"], ["IMOBILIARIA", "Moradia"], ["IPTU", "Moradia"],
    ["ENEL", "Moradia"], ["CPFL", "Moradia"], ["LIGHT S", "Moradia"], ["CEMIG", "Moradia"], ["COPEL", "Moradia"], ["COELBA", "Moradia"], ["CELESC", "Moradia"], ["ENERGISA", "Moradia"], ["ENERGIA", "Moradia"],
    ["SABESP", "Moradia"], ["SANEPAR", "Moradia"], ["CEDAE", "Moradia"], ["COPASA", "Moradia"], ["COMGAS", "Moradia"], ["NATURGY", "Moradia"], ["ULTRAGAZ", "Moradia"], ["LIQUIGAS", "Moradia"],
    ["VIVO", "Moradia"], ["CLARO", "Moradia"], ["TIM ", "Moradia"], ["OI FIBRA", "Moradia"], ["NET SERV", "Moradia"], ["TELECOM", "Moradia"], ["INTERNET", "Moradia"], ["PROVEDOR", "Moradia"],
    ["VERISURE", "Moradia"], ["LEROY", "Moradia"], ["TELHANORTE", "Moradia"], ["TOK&STOK", "Moradia"], ["TOK STOK", "Moradia"], ["CAMICADO", "Moradia"], ["DIARISTA", "Moradia"],
    // mercado
    ["PAO DE ACUCAR", "Mercado"], ["CARREFOUR", "Mercado"], ["ASSAI", "Mercado"], ["ATACAD", "Mercado"], ["SUPERMERC", "Mercado"], ["MERCADO ", "Mercado"], ["HORTIFRUTI", "Mercado"],
    ["HORTI", "Mercado"], ["SAMS CLUB", "Mercado"], ["EXTRA ", "Mercado"], ["ST MARCHE", "Mercado"], ["OXXO", "Mercado"], ["MINUTO PA", "Mercado"], ["DIA BRASIL", "Mercado"], ["ZAFFARI", "Mercado"],
    ["SONDA", "Mercado"], ["COMERCIO DE ALIM", "Mercado"], ["ALIMENTOS", "Mercado"], ["FACEBK", "Outros"], ["FACEBOOK", "Outros"], ["GOOGLE ADS", "Outros"], ["MAMBO", "Mercado"], ["EMPORIO", "Mercado"], ["SACOLAO", "Mercado"], ["DAKI", "Mercado"], ["CONFIANCA", "Mercado"], ["SAVEGNAGO", "Mercado"], ["COOP ", "Mercado"],
    // alimentação fora
    ["IFOOD", "Alimentação fora"], ["IFD*", "Alimentação fora"], ["RAPPI", "Alimentação fora"], ["UBER EATS", "Alimentação fora"], ["UBER *EATS", "Alimentação fora"], ["ZE DELIVERY", "Alimentação fora"],
    ["RESTAURANTE", "Alimentação fora"], ["RESTAURA", "Alimentação fora"], ["LANCHONETE", "Alimentação fora"], ["PADARIA", "Alimentação fora"], ["PANIFICADORA", "Alimentação fora"], ["PIZZ", "Alimentação fora"],
    ["BURGER", "Alimentação fora"], ["HAMBURG", "Alimentação fora"], ["CAFE", "Alimentação fora"], ["COFFEE", "Alimentação fora"], ["STARBUCKS", "Alimentação fora"], ["OUTBACK", "Alimentação fora"],
    ["MADERO", "Alimentação fora"], ["MCDONALD", "Alimentação fora"], ["BK ", "Alimentação fora"], ["BURGER KING", "Alimentação fora"], ["SUBWAY", "Alimentação fora"], ["HABIBS", "Alimentação fora"],
    ["ACAI", "Alimentação fora"], ["SORVET", "Alimentação fora"], ["GELATO", "Alimentação fora"], ["BACIO DI LATTE", "Alimentação fora"], ["CHOCOLAT", "Alimentação fora"], ["DOCES", "Alimentação fora"],
    ["BISTRO", "Alimentação fora"], ["BAR ", "Alimentação fora"], ["CHURRASC", "Alimentação fora"], ["SUSHI", "Alimentação fora"], ["ESFIHA", "Alimentação fora"], ["LANCHE", "Alimentação fora"], ["BOLOS", "Alimentação fora"],
    // transporte
    ["UBER", "Transporte"], ["99APP", "Transporte"], ["99 APP", "Transporte"], ["99TAXI", "Transporte"], ["CABIFY", "Transporte"], ["POSTO", "Transporte"], ["AUTO POSTO", "Transporte"], ["AUTOPOSTO", "Transporte"],
    ["SHELL", "Transporte"], ["IPIRANGA", "Transporte"], ["PETROBRAS", "Transporte"], ["COMBUST", "Transporte"], ["ESTACIONA", "Transporte"], ["PARK", "Transporte"], ["ZONA AZUL", "Transporte"],
    ["SEM PARAR", "Transporte"], ["CONECTCAR", "Transporte"], ["VELOE", "Transporte"], ["PEDAGIO", "Transporte"], ["METRO", "Transporte"], ["BILHETE UNICO", "Transporte"], ["CPTM", "Transporte"],
    ["AUTOMOTIVO", "Transporte"], ["MECANICA", "Transporte"], ["PNEU", "Transporte"], ["LAVA RAPIDO", "Transporte"], ["DETRAN", "Impostos e taxas"], ["IPVA", "Impostos e taxas"],
    // saúde
    ["DROGASIL", "Saúde"], ["DROGA RAIA", "Saúde"], ["RAIA", "Saúde"], ["DROGARIA", "Saúde"], ["FARMACIA", "Saúde"], ["PAGUE MENOS", "Saúde"], ["PANVEL", "Saúde"], ["DROGAO", "Saúde"],
    ["HOSPITAL", "Saúde"], ["LABORAT", "Saúde"], ["FLEURY", "Saúde"], ["DASA", "Saúde"], ["CLINICA", "Saúde"], ["ODONTO", "Saúde"], ["DENTIST", "Saúde"], ["MEDIC", "Saúde"], ["ORTOPED", "Saúde"],
    ["UNIMED", "Saúde"], ["AMIL", "Saúde"], ["SULAMERICA SAUDE", "Saúde"], ["BRADESCO SAUDE", "Saúde"], ["HAPVIDA", "Saúde"], ["NOTREDAME", "Saúde"], ["MEVO", "Saúde"], ["PSICOLOG", "Saúde"],
    ["SMARTFIT", "Saúde"], ["SMART FIT", "Saúde"], ["SKYFIT", "Saúde"], ["ACADEMIA", "Saúde"], ["BLUEFIT", "Saúde"], ["TOTALPASS", "Saúde"], ["GYMPASS", "Saúde"], ["WELLHUB", "Saúde"], ["PILATES", "Saúde"],
    // educação
    ["ESCOLA", "Educação"], ["COLEGIO", "Educação"], ["FACULDADE", "Educação"], ["UNIVERSIDADE", "Educação"], ["CURSO", "Educação"], ["INGLES", "Educação"], ["IDIOMAS", "Educação"],
    ["UDEMY", "Educação"], ["ALURA", "Educação"], ["HOTMART", "Educação"], ["MEDWAY", "Educação"], ["LIVRARIA", "Educação"], ["CONGRESSO", "Educação"], ["SARAIVA", "Educação"],
    // cuidados pessoais
    ["SALAO", "Cuidados pessoais"], ["HAIR", "Cuidados pessoais"], ["CABELEIR", "Cuidados pessoais"], ["BARBEARIA", "Cuidados pessoais"], ["BARBER", "Cuidados pessoais"], ["MANICURE", "Cuidados pessoais"],
    ["ESTETICA", "Cuidados pessoais"], ["PERFUMARIA", "Cuidados pessoais"], ["SEPHORA", "Cuidados pessoais"], ["NATURA", "Cuidados pessoais"], ["BOTICARIO", "Cuidados pessoais"], ["EUDORA", "Cuidados pessoais"],
    ["STUDIO", "Cuidados pessoais"], ["DEPILA", "Cuidados pessoais"],
    // pets
    ["PET", "Pets"], ["COBASI", "Pets"], ["PETZ", "Pets"], ["VETERIN", "Pets"],
    // lazer e viagens
    ["CINEMA", "Lazer e viagens"], ["CINEMARK", "Lazer e viagens"], ["CINEPOLIS", "Lazer e viagens"], ["INGRESSO", "Lazer e viagens"], ["SYMPLA", "Lazer e viagens"], ["TEATRO", "Lazer e viagens"],
    ["HOTEL", "Lazer e viagens"], ["POUSADA", "Lazer e viagens"], ["AIRBNB", "Lazer e viagens"], ["BOOKING", "Lazer e viagens"], ["DECOLAR", "Lazer e viagens"], ["LATAM", "Lazer e viagens"],
    ["GOL LINHAS", "Lazer e viagens"], ["AZUL LINHAS", "Lazer e viagens"], ["SMILES", "Lazer e viagens"], ["LIVELO", "Lazer e viagens"], ["ZARPO", "Lazer e viagens"], ["TURISMO", "Lazer e viagens"],
    ["CVC", "Lazer e viagens"], ["BRINQUED", "Lazer e viagens"], ["PARQUE", "Lazer e viagens"], ["STEAM", "Lazer e viagens"], ["PLAYSTATION", "Lazer e viagens"], ["NINTENDO", "Lazer e viagens"],
    // compras
    ["AMAZON", "Compras"], ["MERCADOLIVRE", "Compras"], ["MERCADO LIVRE", "Compras"], ["MAGALU", "Compras"], ["MAGAZINE", "Compras"], ["AMERICANAS", "Compras"], ["SHOPEE", "Compras"],
    ["SHEIN", "Compras"], ["ALIEXPRESS", "Compras"], ["CASAS BAHIA", "Compras"], ["RENNER", "Compras"], ["C&A", "Compras"], ["RIACHUELO", "Compras"], ["ZARA", "Compras"], ["AREZZO", "Compras"],
    ["MELISSA", "Compras"], ["CENTAURO", "Compras"], ["NETSHOES", "Compras"], ["DECATHLON", "Compras"], ["HERING", "Compras"], ["JOIAS", "Compras"], ["VIVARA", "Compras"], ["KALUNGA", "Compras"],
    ["FAST SHOP", "Compras"], ["LOJA", "Compras"], ["SHOP", "Compras"],
    // seguros, impostos, tarifas
    ["SEGURO", "Seguros"], ["PORTO SEGURO", "Seguros"], ["PRESTAMISTA", "Seguros"],
    ["DARF", "Impostos e taxas"], ["GPS ", "Impostos e taxas"], ["SIMPLES NACIONAL", "Impostos e taxas"], ["CARTORIO", "Impostos e taxas"],
    ["TARIFA", "Tarifas e juros"], ["PACOTE DE SERVICOS", "Tarifas e juros"], ["IOF", "Tarifas e juros"], ["JUROS", "Tarifas e juros"], ["ENCARGO", "Tarifas e juros"], ["ANUIDADE", "Tarifas e juros"],
    ["MULTA", "Tarifas e juros"], ["MORA", "Tarifas e juros"],
    // transferências e saques
    ["SAQUE", "Saques"], ["PIX ENVIADO", "Transferências"], ["PIX TRANSF", "Transferências"], ["TRANSF ENVIADA", "Transferências"], ["TRANSFERENCIA", "Transferências"], ["TED ", "Transferências"], ["DOC ", "Transferências"]
  ];

  var CHAVE = "vhg-extratos-regras";
  function regrasDoUsuario() {
    try { var r = JSON.parse(localStorage.getItem(CHAVE) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; }
  }
  function salvarRegras(lista) {
    try { localStorage.setItem(CHAVE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }
  function chave(s) { return " " + String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ") + " "; }

  // A palavra-chave precisa começar no início de uma palavra ("BK " não pega "FACEBK ")
  function contem(d, k) {
    if (!k) return false;
    var i = d.indexOf(k);
    while (i >= 0) {
      if (i === 0 || !/[A-Z0-9]/.test(d[i - 1]) || !/[A-Z0-9]/.test(k[0])) return true;
      i = d.indexOf(k, i + 1);
    }
    return false;
  }

  function categorizar(t, usuario) {
    var d = chave(t.original);
    var todas = (usuario || []).concat(REGRAS);
    for (var i = 0; i < todas.length; i++) {
      if (contem(d, chave(todas[i][0]).slice(1, -1).replace(/ $/, "") + (/ $/.test(todas[i][0]) ? " " : ""))) {
        var c = todas[i][1];
        // receitas/estornos só fazem sentido como entrada; o inverso também
        if ((c === "Receitas" || c === "Estornos e créditos") && t.valor < 0) continue;
        if (c === "Pagamento de fatura" && t.tipoDoc === "cartao" && t.valor < 0) continue;
        return { categoria: c, regra: todas[i][0], doUsuario: i < (usuario || []).length };
      }
    }
    if (t.pagamento) return { categoria: "Pagamento de fatura", regra: null };
    if (t.dica) return { categoria: t.dica, regra: "ramo informado pelo banco" };
    if (t.valor > 0) return { categoria: t.tipoDoc === "cartao" ? "Estornos e créditos" : "Receitas", regra: null };
    if (/^ PIX|^ TRANSF/.test(d)) return { categoria: "Transferências", regra: null };
    return { categoria: "A revisar", regra: null };
  }

  // ── Análise ───────────────────────────────────────────────────
  function r2(v) { return Math.round(v * 100) / 100; }
  function nomeMes(ym) {
    var M = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    var p = ym.split("-"); return M[+p[1] - 1] + " de " + p[0];
  }
  function chaveComercio(s) {
    return chave(s).replace(/\d+/g, "").replace(/[^A-Z ]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 2).join(" ");
  }

  function analisar(trans) {
    var gastos = trans.filter(function (t) { return t.valor < 0 && !NAO_GASTO[t.categoria]; });
    var estornos = trans.filter(function (t) { return t.categoria === "Estornos e créditos"; });
    var receitas = trans.filter(function (t) { return t.valor > 0 && t.categoria === "Receitas"; });
    var investido = r2(-trans.filter(function (t) { return t.categoria === "Investimentos"; }).reduce(function (a, t) { return a + t.valor; }, 0));
    var totalGastos = r2(-gastos.reduce(function (a, t) { return a + t.valor; }, 0));
    var totalEstornos = r2(estornos.reduce(function (a, t) { return a + t.valor; }, 0));
    var totalReceitas = r2(receitas.reduce(function (a, t) { return a + t.valor; }, 0));
    var meses = {}; trans.forEach(function (t) { meses[t.competencia] = 1; });
    meses = Object.keys(meses).sort();

    var porCat = {};
    gastos.forEach(function (t) { var c = porCat[t.categoria] || (porCat[t.categoria] = { categoria: t.categoria, total: 0, n: 0 }); c.total = r2(c.total - t.valor); c.n++; });
    var cats = Object.keys(porCat).map(function (k) { return porCat[k]; }).sort(function (a, b) { return b.total - a.total; });
    cats.forEach(function (c) { c.pct = totalGastos ? c.total / totalGastos * 100 : 0; c.pctRenda = totalReceitas ? c.total / totalReceitas * 100 : null; });

    var porMes = meses.map(function (m) {
      var g = gastos.filter(function (t) { return t.competencia === m; });
      var e = receitas.filter(function (t) { return t.competencia === m; });
      return { mes: m, gastos: r2(-g.reduce(function (a, t) { return a + t.valor; }, 0)), entradas: r2(e.reduce(function (a, t) { return a + t.valor; }, 0)) };
    });

    // Parcelas: o que ainda falta pagar
    var parcelas = gastos.filter(function (t) { return t.parcela; }).map(function (t) {
      return { t: t, faltam: t.parcela.total - t.parcela.atual, restante: r2(-t.valor * (t.parcela.total - t.parcela.atual)) };
    }).sort(function (a, b) { return b.restante - a.restante; });
    var totalParcelasFuturas = r2(parcelas.reduce(function (a, p) { return a + p.restante; }, 0));

    // Recorrentes: assinaturas e contas fixas, ou o mesmo comércio em 2+ meses
    var recorr = [], vistos = {};
    if (meses.length >= 2) {
      var grupos = {};
      gastos.forEach(function (t) { var k = chaveComercio(t.original); (grupos[k] = grupos[k] || []).push(t); });
      Object.keys(grupos).forEach(function (k) {
        var g = grupos[k], ms = {};
        g.forEach(function (t) { ms[t.competencia] = 1; });
        if (Object.keys(ms).length >= 2) { var u = g[g.length - 1]; recorr.push(u); vistos[k] = 1; }
      });
    }
    gastos.forEach(function (t) {
      var k = chaveComercio(t.original);
      if (vistos[k]) return;
      if (t.categoria === "Assinaturas" || /ALUGUEL|CONDOMINIO|ESCOLA|COLEGIO|UNIMED|AMIL|SEGURO|ACADEMIA|SMART ?FIT|ENERGIA|ENEL|SABESP|VIVO|CLARO|INTERNET|PACOTE DE SERVICOS|QUINTOANDAR|VERISURE/.test(chave(t.original))) { recorr.push(t); vistos[k] = 1; }
    });
    var mediaDiv = Math.max(1, meses.length);
    var totalRecorrentes = r2(-recorr.reduce(function (a, t) { return a + t.valor; }, 0));
    var assinaturas = gastos.filter(function (t) { return t.categoria === "Assinaturas"; });
    var totalAssin = r2(-assinaturas.reduce(function (a, t) { return a + t.valor; }, 0));

    var top = gastos.slice().sort(function (a, b) { return a.valor - b.valor; }).slice(0, 10);
    var revisar = trans.filter(function (t) { return t.categoria === "A revisar"; });

    // Delivery e comer fora
    var delivery = gastos.filter(function (t) { return /IFOOD|IFD\*|RAPPI|UBER ?\*?EATS|ZE DELIVERY/.test(chave(t.original)); });
    var fora = porCat["Alimentação fora"] ? porCat["Alimentação fora"].total : 0;
    var media = function (v) { return r2(v / mediaDiv); };

    // Destaques em frases
    var ins = [];
    if (cats[0]) ins.push({ t: "MAIOR CATEGORIA", h: "<b>" + cats[0].categoria + "</b> foi onde mais saiu dinheiro: <b>" + brl(cats[0].total) + "</b>, " + n1(cats[0].pct) + "% dos gastos" + (meses.length > 1 ? " no período" : "") + "." });
    if (delivery.length) ins.push({ t: "DELIVERY", h: "<b>" + delivery.length + " pedidos</b> de delivery somaram " + brl(-delivery.reduce(function (a, t) { return a + t.valor; }, 0)) + ". Comer fora no total: <b>" + brl(fora) + "</b>." });
    if (assinaturas.length) ins.push({ t: "ASSINATURAS", h: assinaturas.length + " cobranças de assinatura: <b>" + brl(media(totalAssin)) + " por mês</b>, cerca de " + brl(media(totalAssin) * 12) + " por ano." });
    if (parcelas.length) ins.push({ t: "PARCELAS", h: "<b>" + parcelas.length + " compras parceladas</b> em andamento. Ainda faltam <b>" + brl(totalParcelasFuturas) + "</b> nas próximas faturas." });
    var modoRenda = totalReceitas > 0 && totalReceitas >= totalGastos * 0.2; // só faz sentido com extrato de conta que traz a renda
    if (modoRenda) {
      var sobra = r2(totalReceitas - totalGastos);
      ins.push({ t: "SOBRA", h: "Entrou " + brl(totalReceitas) + " e saíram " + brl(totalGastos) + " em gastos. " + (sobra >= 0 ? "Sobrou <b>" + brl(sobra) + "</b> (" + n1(sobra / totalReceitas * 100) + "% da renda)." : "Faltaram <b>" + brl(-sobra) + "</b>.") });
    }
    var tarifas = porCat["Tarifas e juros"];
    if (tarifas && tarifas.total > 0) ins.push({ t: "TARIFAS E JUROS", h: "Foram <b>" + brl(tarifas.total) + "</b> em tarifas, juros e encargos. Vale ver se dá para renegociar ou evitar." });
    var grande = top[0];
    if (grande && totalGastos && -grande.valor / totalGastos > 0.15) ins.push({ t: "GASTO GRANDE", h: "Um único lançamento, <b>" + esc(grande.descricao) + "</b>, foi " + n1(-grande.valor / totalGastos * 100) + "% de todos os gastos (" + brl(-grande.valor) + ")." });
    if (revisar.length) ins.push({ t: "A REVISAR", h: "<b>" + revisar.length + (revisar.length > 1 ? " lançamentos ficaram" : " lançamento ficou") + " sem categoria</b>. Vale classificar antes de baixar o PDF." });

    return {
      modoRenda: modoRenda, meses: meses, porMes: porMes, cats: cats, totalGastos: totalGastos, totalReceitas: totalReceitas, totalEstornos: totalEstornos, investido: investido,
      sobra: totalReceitas ? r2(totalReceitas - totalGastos) : null, top: top, parcelas: parcelas, totalParcelasFuturas: totalParcelasFuturas,
      recorrentes: recorr, totalRecorrentes: totalRecorrentes, assinaturas: assinaturas, totalAssinaturas: totalAssin, revisar: revisar,
      destaques: ins, nGastos: gastos.length, mediaMensalGastos: media(totalGastos)
    };
  }
  function brl(v) { return (v < 0 ? "−" : "") + "R$ " + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function n1(v) { return (Math.round(v * 10) / 10).toLocaleString("pt-BR"); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  var api = { CATEGORIAS: CATEGORIAS, NAO_GASTO: NAO_GASTO, REGRAS: REGRAS, regrasDoUsuario: regrasDoUsuario, salvarRegras: salvarRegras, categorizar: categorizar, analisar: analisar, nomeMes: nomeMes, brl: brl, n1: n1, chaveComercio: chaveComercio };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.VHG_EXTRATOS_CATEGORIAS = api;
})(this);
