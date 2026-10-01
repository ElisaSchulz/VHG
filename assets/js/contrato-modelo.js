// ─────────────────────────────────────────────────────────────
//  contrato-modelo.js — texto do contrato de prestação de serviços
//
//  O contrato é montado com os dados da ficha cadastral e o plano
//  escolhido. O texto assinado fica guardado no banco exatamente
//  como foi lido, então mudar este arquivo NÃO altera contratos já
//  assinados; só os próximos.
//
//  ⚠ MODELO PROVISÓRIO. Antes de usar com clientes:
//    1. preencha os dados do CONTRATADO abaixo;
//    2. revise as cláusulas (de preferência com um advogado);
//    3. mude REVISADO para true e suba a VERSAO.
//  Enquanto REVISADO for false, a página do contrato mostra um aviso
//  de "modelo em revisão".
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";

  var CONFIG = {
    VERSAO: "2026-10-v0",
    REVISADO: false,
    CONTRATADO: {
      nome: "Vitor Hugo Germano",
      qualificacao: "brasileiro, economista",
      documento: "CPF nº [preencher]",
      endereco: "[endereço profissional — preencher]",
      email: "germanovitorhugo@gmail.com"
    },
    // Prazo para pagar e onde a cobrança chega.
    COBRANCA: "As datas de vencimento e os dados para pagamento serão enviados pelo CONTRATADO ao e-mail do CONTRATANTE informado neste contrato."
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
     ["profissao", "profissão"], ["logradouro", "endereço"], ["numero", "número"], ["cidade", "cidade"], ["estado", "estado"], ["email", "e-mail"]]
      .forEach(function (c) { if (!String(f[c[0]] || "").trim()) falta.push(c[1]); });
    var p = P[f.plano];
    if (!p) falta.push("plano escolhido");
    else if (p.pagamentos.length > 1 && !f.formaPagamento) falta.push("forma de pagamento");
    else if (f.plano === "patrimonial" && !window.VHG_PLANOS.faixaDoPatrimonio(f.patrimonioEstimado)) falta.push("patrimônio a ser acompanhado");
    return falta;
  }

  // Devolve { titulo, versao, texto } — `texto` é o que fica gravado e
  // assinado. Linhas que começam com "CLÁUSULA" viram títulos na tela.
  function gerar(f, hoje) {
    var P = window.VHG_PLANOS.PLANOS;
    var p = P[f.plano];
    var K = CONFIG.CONTRATADO;
    var pagamento = p.pagamentos.length === 1 ? p.pagamentos[0][1]
      : (p.pagamentos.filter(function (x) { return x[0] === f.formaPagamento; })[0] || [])[1];
    var faixa = f.plano === "patrimonial" ? window.VHG_PLANOS.faixaDoPatrimonio(f.patrimonioEstimado) : null;
    var taxa = faixa ? faixa.taxa.toFixed(2).replace(".", ",") + "% ao ano" : "";

    var preco = f.plano === "patrimonial"
      ? "Pelos serviços, o CONTRATANTE pagará ao CONTRATADO taxa de administração de " + taxa + " sobre o patrimônio acompanhado, " +
        "estimado na data de assinatura em " + br(f.patrimonioEstimado) + " (faixa " + faixa.rotulo + "). A taxa será recalculada se o patrimônio mudar de faixa, " +
        "conforme a tabela vigente no site do CONTRATADO."
      : "Pelos serviços, o CONTRATANTE pagará ao CONTRATADO o valor de " + pagamento + ".";

    var C = [];
    C.push("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PLANEJAMENTO FINANCEIRO PESSOAL");
    C.push("CONTRATANTE: " + f.nome.trim() + ", " + f.nacionalidade.trim().toLowerCase() + ", " + String(f.estadoCivil).toLowerCase() + ", " + f.profissao.trim().toLowerCase() +
      ", portador(a) do RG nº " + f.rg.trim() + ", inscrito(a) no CPF sob o nº " + cpfMascara(f.cpf) + ", residente e domiciliado(a) em " + endereco(f) +
      ", e-mail " + f.email.trim() + ".");
    C.push("CONTRATADO: " + K.nome + ", " + K.qualificacao + ", " + K.documento + ", com endereço em " + K.endereco + ", e-mail " + K.email + ".");
    C.push("As partes acima identificadas celebram o presente contrato, que se regerá pelas cláusulas a seguir.");

    C.push("CLÁUSULA 1 – DO OBJETO");
    C.push("1.1. O presente contrato tem por objeto a prestação, pelo CONTRATADO, de serviços de planejamento financeiro pessoal na modalidade " + p.nome + ", compreendendo: " +
      p.servicos.join("; ") + ".");
    C.push("1.2. Os serviços são prestados de forma remota (online), por reuniões, mensagens e documentos compartilhados.");

    C.push("CLÁUSULA 2 – DA NATUREZA DOS SERVIÇOS");
    C.push("2.1. O CONTRATADO atua de forma independente, sem vínculo com bancos ou instituições financeiras.");
    C.push("2.2. As análises, projeções e recomendações têm caráter orientativo e baseiam-se nas informações fornecidas pelo CONTRATANTE. Não constituem garantia ou promessa de rentabilidade, e as decisões finais sobre o próprio patrimônio cabem ao CONTRATANTE.");

    C.push("CLÁUSULA 3 – DO PRAZO");
    C.push("3.1. O contrato vigora por " + p.prazoMeses + " (" + (p.prazoMeses === 3 ? "três" : "doze") + ") meses a contar da data de assinatura, podendo ser renovado por acordo entre as partes.");

    C.push("CLÁUSULA 4 – DO PREÇO E DA FORMA DE PAGAMENTO");
    C.push("4.1. " + preco);
    C.push("4.2. " + CONFIG.COBRANCA);

    C.push("CLÁUSULA 5 – DAS OBRIGAÇÕES DO CONTRATANTE");
    C.push("5.1. Fornecer informações verdadeiras, completas e atualizadas sobre sua situação financeira, inclusive na ficha cadastral e no diagnóstico financeiro.");
    C.push("5.2. Comparecer às reuniões combinadas e efetuar os pagamentos nas datas acordadas.");

    C.push("CLÁUSULA 6 – DAS OBRIGAÇÕES DO CONTRATADO");
    C.push("6.1. Prestar os serviços descritos na Cláusula 1 com diligência, independência e dentro do prazo contratado.");
    C.push("6.2. Manter sigilo sobre todas as informações do CONTRATANTE, usando-as apenas para a execução deste contrato.");

    C.push("CLÁUSULA 7 – DOS DADOS PESSOAIS");
    C.push("7.1. Os dados pessoais do CONTRATANTE serão tratados conforme a Lei nº 13.709/2018 (LGPD) e a Política de Privacidade disponível no site do CONTRATADO, exclusivamente para a execução deste contrato.");

    C.push("CLÁUSULA 8 – DO DIREITO DE ARREPENDIMENTO E DA RESCISÃO");
    C.push("8.1. Por se tratar de contratação feita pela internet, o CONTRATANTE poderá desistir do contrato em até 7 (sete) dias contados da assinatura, com devolução integral de valores eventualmente pagos, nos termos do art. 49 do Código de Defesa do Consumidor.");
    C.push("8.2. Após esse prazo, qualquer das partes poderá rescindir o contrato mediante aviso por escrito com 30 (trinta) dias de antecedência, sendo devidos os valores proporcionais aos serviços já prestados.");

    C.push("CLÁUSULA 9 – DA ASSINATURA ELETRÔNICA");
    C.push("9.1. As partes reconhecem como válida a assinatura deste contrato por meio eletrônico, na área do cliente do site do CONTRATADO, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020. A assinatura é registrada com nome, data, hora, endereço IP e código de verificação do documento.");

    C.push("CLÁUSULA 10 – DO FORO");
    C.push("10.1. Fica eleito o foro do domicílio do CONTRATANTE para dirimir quaisquer questões oriundas deste contrato.");

    C.push("Documento gerado em " + dataExtenso(hoje || new Date()) + " · versão " + CONFIG.VERSAO + ".");

    return { titulo: C[0], versao: CONFIG.VERSAO, texto: C.join("\n\n") };
  }

  window.VHG_CONTRATO = { CONFIG: CONFIG, gerar: gerar, faltandoNaFicha: faltandoNaFicha };
})();
