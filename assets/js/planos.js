// ─────────────────────────────────────────────────────────────
//  planos.js — os três planos de serviço, num lugar só.
//  A ficha cadastral (escolha do plano) e o contrato usam estes
//  dados. Se um preço mudar, mude aqui E na seção Serviços do
//  index.html.
// ─────────────────────────────────────────────────────────────
(function () {
  "use strict";

  var PLANOS = {
    pontual: {
      nome: "Planejamento Pontual",
      prazoMeses: 3,
      rotulo: "Planejamento Pontual · 3 meses · 3x de R$ 340,00",
      servicos: [
        "Diagnóstico inicial da situação financeira",
        "Relatório de análise do consultor",
        "Primeira proposta de possíveis melhorias",
        "Passagem por todas as etapas de planejamento",
        "Ajuda operacional com a Instituição Financeira",
        "Execução do plano"
      ],
      pagamentos: [
        ["3x", "3 parcelas mensais de R$ 340,00, totalizando R$ 1.020,00"],
        ["avista", "à vista, R$ 970,00 (5% de desconto)"]
      ]
    },
    recorrente: {
      nome: "Planejamento Recorrente",
      prazoMeses: 12,
      rotulo: "Planejamento Recorrente · 12 meses · 12x de R$ 250,00",
      servicos: [
        "Tudo do Planejamento Pontual",
        "Reuniões mensais de alinhamento",
        "Contato ilimitado ao consultor financeiro"
      ],
      pagamentos: [
        ["12x", "12 parcelas mensais de R$ 250,00, totalizando R$ 3.000,00"]
      ]
    },
    patrimonial: {
      nome: "Planejamento Patrimonial",
      prazoMeses: 12,
      rotulo: "Planejamento Patrimonial · patrimônio a partir de R$ 300 mil · taxa anual por faixa",
      servicos: [
        "Tudo do Planejamento Recorrente",
        "Gestão de investimentos financeiros",
        "Análise econômica dos consultores",
        "Acompanhamento quinzenal da carteira"
      ],
      pagamentos: [
        ["taxa", "taxa de administração anual sobre o patrimônio acompanhado, conforme a faixa"]
      ],
      patrimonioMinimo: 300000
    }
  };

  // Taxa anual do Planejamento Patrimonial conforme o patrimônio.
  var FAIXAS = [
    [300000, 500000, 1.00, "R$ 300 mil – R$ 500 mil"],
    [500000, 1000000, 0.80, "+ R$ 500 mil – R$ 1 milhão"],
    [1000000, 3000000, 0.70, "+ R$ 1 milhão – R$ 3 milhões"],
    [3000000, 5000000, 0.60, "+ R$ 3 milhões – R$ 5 milhões"],
    [5000000, Infinity, 0.50, "+ R$ 5 milhões"]
  ];
  function faixaDoPatrimonio(valor) {
    var v = Number(valor) || 0;
    if (v < FAIXAS[0][0]) return null;
    for (var i = 0; i < FAIXAS.length; i++) {
      if (v <= FAIXAS[i][1]) return { de: FAIXAS[i][0], ate: FAIXAS[i][1], taxa: FAIXAS[i][2], rotulo: FAIXAS[i][3] };
    }
    return null;
  }

  window.VHG_PLANOS = { PLANOS: PLANOS, FAIXAS: FAIXAS, faixaDoPatrimonio: faixaDoPatrimonio };
})();
