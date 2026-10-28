// ─────────────────────────────────────────────────────────────
//  contrato-modelo.js — texto do contrato de prestação de serviços
//
//  O contrato é montado com os dados da ficha cadastral e o plano
//  escolhido. O texto assinado fica guardado no banco exatamente
//  como foi lido, então mudar este arquivo NÃO altera contratos já
//  assinados; só os próximos.
//
//  Texto revisado e aprovado pelo Vitor em outubro de 2026
//  (arquivo "contrato-vhg-revisao-comparada-aprovada.docx" na pasta
//  contrato/ do projeto). Se mudar alguma cláusula, suba a VERSAO.
//
//  Numeração: a Cláusula 3 (política de investimentos e Mont
//  Capital) só existe no Patrimonial. No Pontual e no Recorrente as
//  cláusulas seguintes sobem um número (Prazo vira 3, Preço vira 4…).
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";

  var CONFIG = {
    VERSAO: "2026-10-v3",
    REVISADO: true,
    CONTRATADO: {
      empresa: "55.823.708 VITOR HUGO GERMANO",
      cnpj: "55.823.708/0001-34",
      titular: "Vitor Hugo Germano",
      nacionalidade: "brasileiro",
      formacao: "graduado em Economia",
      // Dados pessoais do titular previstos no contrato aprovado.
      // Enquanto estiverem vazios, o trecho correspondente não aparece.
      estadoCivil: "",
      rg: "",
      rgOrgao: "",
      cpf: "",
      email: "germanovitorhugo@gmail.com"
    },
    MONT: "Mont Capital Gestão e Administração de Recursos S.A. (“Mont Capital”), inscrita no CNPJ/MF sob o nº 22.598.618/0001-38"
  };

  // Lista completa de serviços de cada plano, como no contrato aprovado
  // (a ficha e o site continuam usando a lista curta de planos.js).
  var SERVICOS_PONTUAL = [
    "diagnóstico inicial da situação financeira",
    "relatório de análise do planejador",
    "primeira proposta de melhorias na organização financeira, como orçamento, dívidas, reserva de emergência e objetivos",
    "passagem por todas as etapas do planejamento financeiro",
    "orientação operacional para que o próprio CONTRATANTE realize, junto às instituições financeiras com as quais já se relaciona, as ações previstas no plano",
    "acompanhamento da implementação do plano pelo CONTRATANTE"
  ];
  var SERVICOS_RECORRENTE = SERVICOS_PONTUAL.concat([
    "reuniões mensais de acompanhamento do planejamento",
    "contato ilimitado com o planejador financeiro para dúvidas sobre o planejamento, por mensagem, em dias úteis"
  ]);
  var SERVICOS = {
    pontual: SERVICOS_PONTUAL,
    recorrente: SERVICOS_RECORRENTE,
    patrimonial: SERVICOS_RECORRENTE.concat([
      "elaboração da política de investimentos do CONTRATANTE, nos termos da Cláusula 3",
      "análise do cenário econômico e de seus efeitos sobre o planejamento do CONTRATANTE",
      "acompanhamento quinzenal da aderência do patrimônio à política de investimentos e ao planejamento"
    ])
  };

  function br(n) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n) || 0); }
  function dataExtenso(d) { return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }); }
  function cpfMascara(v) { var d = String(v || "").replace(/\D/g, ""); return d.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : v; }
  function endereco(f) {
    var rua = [f.logradouro, f.numero].filter(Boolean).join(", ") + (f.complemento ? " – " + f.complemento : "");
    return [rua, f.bairro, [f.cidade, f.estado].filter(Boolean).join("/"), f.cep ? "CEP " + f.cep : ""].filter(Boolean).join(", ");
  }

  // Campos da ficha sem os quais o contrato não pode ser gerado.
  function faltandoNaFicha(f) {
    var P = window.VHG_PLANOS.PLANOS;
    var falta = [];
    [["nome", "nome"], ["cpf", "CPF"], ["rg", "RG"], ["nacionalidade", "nacionalidade"], ["estadoCivil", "estado civil"],
     ["profissao", "profissão"], ["logradouro", "endereço"], ["numero", "número"], ["cidade", "cidade"], ["estado", "estado"], ["email", "e-mail"], ["whatsapp", "WhatsApp"]]
      .forEach(function (c) { if (!String(f[c[0]] || "").trim()) falta.push(c[1]); });
    var p = P[f.plano];
    if (!p) falta.push("plano escolhido");
    else if (p.pagamentos.length > 1 && !f.formaPagamento) falta.push("forma de pagamento");
    else if (f.plano === "patrimonial" && !window.VHG_PLANOS.faixaDoPatrimonio(f.patrimonioEstimado)) falta.push("patrimônio a ser acompanhado");
    return falta;
  }

  function qualificacaoContratado(K) {
    var q = [K.nacionalidade];
    if (K.estadoCivil) q.push(K.estadoCivil);
    q.push(K.formacao);
    if (K.rg) q.push("portador do RG nº " + K.rg + (K.rgOrgao ? ", expedido pelo(a) " + K.rgOrgao : ""));
    if (K.cpf) q.push("inscrito no CPF sob o nº " + K.cpf);
    q.push("e-mail " + K.email);
    return q.join(", ");
  }

  // Devolve { titulo, versao, texto } — `texto` é o que fica gravado e
  // assinado. Linhas que começam com "CLÁUSULA" viram títulos na tela.
  function gerar(f, hoje) {
    var P = window.VHG_PLANOS.PLANOS;
    var p = P[f.plano];
    var K = CONFIG.CONTRATADO;
    var pat = f.plano === "patrimonial";
    var pagamento = p.pagamentos.length === 1 ? p.pagamentos[0][1]
      : (p.pagamentos.filter(function (x) { return x[0] === f.formaPagamento; })[0] || [])[1];
    var faixa = pat ? window.VHG_PLANOS.faixaDoPatrimonio(f.patrimonioEstimado) : null;
    var taxa = faixa ? faixa.taxa.toFixed(2).replace(".", ",") + "%" : "";

    // Número de cada cláusula depois da 2: sem a Cláusula 3 no Pontual
    // e no Recorrente, as seguintes sobem um número.
    var n = 2;
    function clausula(titulo) { n++; C.push("CLÁUSULA " + n + " – " + titulo); }
    function item(i, texto) { C.push(n + "." + i + ". " + texto); }

    var C = [];
    C.push("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PLANEJAMENTO FINANCEIRO PESSOAL");
    C.push("CONTRATANTE: " + f.nome.trim() + ", " + f.nacionalidade.trim().toLowerCase() + ", " + String(f.estadoCivil).toLowerCase() + ", " + f.profissao.trim().toLowerCase() +
      ", portador(a) do RG nº " + f.rg.trim() + ", inscrito(a) no CPF sob o nº " + cpfMascara(f.cpf) + ", residente e domiciliado(a) em " + endereco(f) +
      ", e-mail " + f.email.trim() + ", telefone/WhatsApp " + String(f.whatsapp || "").trim() + ".");
    C.push("CONTRATADO: " + K.empresa + ", inscrito no CNPJ sob o nº " + K.cnpj + ", neste ato representado por seu titular, " + K.titular + ", " + qualificacaoContratado(K) + ".");
    C.push("As partes acima identificadas celebram o presente contrato, que se regerá pelas cláusulas a seguir.");

    C.push("CLÁUSULA 1 – DO OBJETO");
    C.push("1.1. O presente contrato tem por objeto a prestação, pelo CONTRATADO, de serviços de planejamento financeiro pessoal na modalidade " + p.nome +
      ", nos limites descritos na Cláusula 2, compreendendo: " + SERVICOS[f.plano].join("; ") + ".");
    C.push("1.2. Os serviços são prestados de forma remota (online), por reuniões, mensagens e documentos compartilhados.");

    C.push("CLÁUSULA 2 – DA NATUREZA DOS SERVIÇOS");
    C.push("2.1. O CONTRATADO atua de forma independente, como planejador financeiro pessoal, sem vínculo com bancos ou instituições financeiras" +
      (pat ? ", ressalvado o disposto na Cláusula 3." : "."));
    C.push(pat
      ? "2.2. Os serviços deste contrato consistem em planejamento financeiro pessoal, isto é, na organização da vida financeira do CONTRATANTE: análise de receitas e despesas, orçamento, gestão de dívidas, formação de reserva de emergência, definição de objetivos e metas e projeções financeiras, acrescidos da política de investimentos descrita na Cláusula 3."
      : "2.2. Os serviços deste contrato consistem exclusivamente em planejamento financeiro pessoal, isto é, na organização da vida financeira do CONTRATANTE: análise de receitas e despesas, orçamento, gestão de dívidas, formação de reserva de emergência, definição de objetivos e metas e projeções financeiras.");
    C.push("2.3. O CONTRATADO não realiza serviços de CONSULTORIA EMPRESARIAL bem como NÃO FAZ ANÁLISE DE QUESTÕES JURÍDICAS e CONTÁBEIS que fujam ao escopo deste trabalho, cabendo a advogados e contadores essas duas últimas atribuições.");
    C.push(pat
      ? "2.4. Esses serviços de investimentos, quando necessários, são prestados pela Mont Capital, nos termos da Cláusula 3."
      : "2.4. Quando o planejamento tratar de investimentos, as orientações do CONTRATADO limitam-se a aspectos gerais, como a importância da reserva de emergência, os prazos dos objetivos, a necessidade de liquidez e o perfil de risco do CONTRATANTE. A escolha de produtos de investimento cabe ao CONTRATANTE, que poderá, se desejar, buscar profissional ou instituição devidamente habilitados.");
    C.push("2.5. As análises, projeções e recomendações têm caráter orientativo e baseiam-se nas informações fornecidas pelo CONTRATANTE. Não constituem garantia ou promessa de rentabilidade, e as decisões finais sobre o próprio patrimônio cabem ao CONTRATANTE.");

    if (pat) {
      clausula("DA POLÍTICA DE INVESTIMENTOS E DA MONT CAPITAL");
      item(1, "Além do planejamento financeiro descrito na Cláusula 2, o CONTRATADO elabora a política de investimentos do CONTRATANTE: documento que registra seus objetivos, horizonte de tempo, perfil e tolerância ao risco, necessidade de liquidez, restrições e diretrizes gerais de alocação por classe de ativos.");
      item(2, "A política de investimentos é um documento de planejamento. Ela não indica valores mobiliários ou produtos de investimento específicos e não constitui recomendação de investimento.");
      item(3, "A parte de investimentos, que inclui a seleção e a recomendação de ativos, a gestão da carteira e a execução de ordens, não integra este contrato. Ela será tratada diretamente entre o CONTRATANTE e a " + CONFIG.MONT + ", em contrato próprio, com suas próprias condições e responsabilidades, por profissionais devidamente autorizados para essa atividade.");
      item(4, "A contratação da Mont Capital é importante para o desenvolvimento do Planejamento Patrimonial. Ao assinar este contrato, o CONTRATANTE declara estar ciente de que firmar o contrato próprio com a Mont Capital para a parte de investimentos será com o intuito de facilitar a prestação de serviço.");
      item(5, "O acompanhamento quinzenal previsto na Cláusula 1 consiste em verificar se o patrimônio do CONTRATANTE continua aderente à política de investimentos e ao planejamento, com base em informações fornecidas pelo CONTRATANTE ou, com sua autorização, pela Mont Capital, e em propor atualizações da política quando os objetivos ou a situação do CONTRATANTE mudarem.");
      item(6, "O CONTRATADO não recebe da Mont Capital nenhuma outra remuneração, comissão ou vantagem relacionada aos investimentos do CONTRATANTE.");
    }

    clausula("DO PRAZO");
    item(1, "O contrato vigora por " + p.prazoMeses + " (" + (p.prazoMeses === 3 ? "três" : "doze") + ") meses a contar da data de assinatura, podendo ser renovado por acordo entre as partes.");

    clausula("DO PREÇO E DA FORMA DE PAGAMENTO");
    item(1, pat
      ? "Pelos serviços, o CONTRATANTE pagará remuneração de " + taxa + " ao ano sobre o patrimônio acompanhado, estimado na data de assinatura em " + br(f.patrimonioEstimado) +
        " (faixa " + faixa.rotulo + "). A taxa será recalculada se o patrimônio mudar de faixa, conforme a tabela vigente no site do CONTRATADO. Essa taxa é a remuneração total do Planejamento Patrimonial, incluindo os serviços deste contrato e os serviços de investimentos prestados pela Mont Capital. O CONTRATANTE não pagará à Mont Capital outra taxa pelos mesmos serviços, além daquelas eventualmente previstas no contrato com ela, como custos de corretagem e taxas dos próprios produtos."
      : "Pelos serviços, o CONTRATANTE pagará ao CONTRATADO " + pagamento + ".");
    item(2, "As datas de vencimento e os dados para pagamento serão enviados pelo CONTRATADO por WhatsApp, no telefone informado pelo CONTRATANTE neste contrato, ou, alternativamente, para o e-mail informado neste contrato.");
    if (pat) item(3, "A cobrança da taxa será feita por cartão de crédito, caso o cliente não opte pela vinculação à MONT CAPITAL, ou, por débito em conta investimento caso o cliente opte pela vinculação à MONT CAPITAL.");

    clausula("DAS OBRIGAÇÕES DO CONTRATANTE");
    item(1, "Fornecer informações verdadeiras, completas e atualizadas sobre sua situação financeira, inclusive na ficha cadastral e no diagnóstico financeiro.");
    item(2, "Comparecer às reuniões combinadas e efetuar os pagamentos nas datas acordadas.");

    clausula("DAS OBRIGAÇÕES DO CONTRATADO");
    item(1, "Prestar os serviços descritos na Cláusula 1 com diligência, independência e dentro do prazo contratado, observados os limites da Cláusula 2.");
    item(2, "Manter sigilo sobre todas as informações do CONTRATANTE, usando-as apenas para a execução deste contrato.");

    clausula("DOS DADOS PESSOAIS");
    item(1, "Os dados pessoais do CONTRATANTE serão tratados conforme a Lei nº 13.709/2018 (LGPD) e a Política de Privacidade disponível no site do CONTRATADO, exclusivamente para a execução deste contrato.");
    if (pat) item(2, "O CONTRATADO somente compartilhará a política de investimentos e demais informações do CONTRATANTE com a Mont Capital mediante autorização expressa do CONTRATANTE.");

    clausula("DO DIREITO DE ARREPENDIMENTO E DA RESCISÃO");
    item(1, "Por se tratar de contratação feita pela internet, o CONTRATANTE poderá desistir do contrato em até 7 (sete) dias contados da assinatura, com devolução integral de valores eventualmente pagos, nos termos do art. 49 do Código de Defesa do Consumidor.");
    item(2, "Após esse prazo, qualquer das partes poderá rescindir o contrato mediante aviso por escrito com 30 (trinta) dias de antecedência, sendo devidos os valores proporcionais aos serviços já prestados.");

    clausula("DA ASSINATURA ELETRÔNICA");
    item(1, "As partes reconhecem como válida a assinatura deste contrato por meio eletrônico, na área do cliente do site do CONTRATADO, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020. A assinatura é registrada com nome, data, hora, endereço IP e código de verificação do documento.");

    clausula("DO FORO");
    item(1, "Fica eleito o foro do domicílio do CONTRATANTE para dirimir quaisquer questões oriundas deste contrato.");

    C.push("Documento gerado em " + dataExtenso(hoje || new Date()) + " · versão " + CONFIG.VERSAO + ".");

    return { titulo: C[0], versao: CONFIG.VERSAO, texto: C.join("\n\n") };
  }

  window.VHG_CONTRATO = { CONFIG: CONFIG, SERVICOS: SERVICOS, gerar: gerar, faltandoNaFicha: faltandoNaFicha };
})();
