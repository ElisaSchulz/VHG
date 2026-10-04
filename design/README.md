# Handoff: Site VHG — Planejamento Financeiro (Vitor Hugo Germano)

## Visão geral
Site institucional de um planejador financeiro independente, com:
1. **Home** (página única com âncoras): hero, provocação, Quem sou, O que faço (6 etapas), Serviços (3 planos), Fale comigo.
2. **Formulários** (pedido de conversa / diagnóstico inicial).
3. **Área do cliente**: login, recuperação de senha e painel com formulários do cliente.
4. **Diagnóstico financeiro**: formulário de 10 etapas (dentro da área do cliente).
5. **Relatório do diagnóstico**: resultado em 13 seções, exportável em PDF.

Idioma: português (pt-BR). Todo o texto está final — usar **verbatim**.

## Sobre os arquivos de design
Os arquivos em `design/` são **referências de design feitas em HTML** (protótipos que mostram aparência e comportamento), não código de produção. A tarefa é **recriar esses designs** num projeto real. Não há codebase existente; recomendação: **Next.js (App Router) + Tailwind** ou **Astro** para o site + **Supabase** para auth e respostas dos formulários (o protótipo já foi pensado para Supabase, ver "Estado").

Para abrir os protótipos: sirva a pasta `design/` com qualquer servidor estático (`npx serve design`) e abra `Site VHG.dc.html`. `support.js` é só o runtime do protótipo — não portar.

Formato dos arquivos: markup entre `<x-dc>…</x-dc>` com estilos inline; `{{ nome }}` são valores vindos da classe JS no fim do arquivo (`renderVals()`); `<sc-if>` = renderização condicional, `<sc-for>` = loop; `style-hover="…"` = estado `:hover`.

Código original anterior (lógica do diagnóstico/relatório): repo `ElisaSchulz/hz-invest` (`diagnostico.html`, `diagnostico-relatorio.html`, `hz-design.css`).

## Fidelidade
**Alta fidelidade.** Cores, tipografia, espaçamentos e textos são finais. Recriar pixel a pixel.

## Design tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| petróleo | `#123B47` | cor primária, hero, botões, títulos |
| petróleo escuro | `#0B2530` | texto principal, rodapé, hover de botão primário |
| cobre | `#C08A4E` | acento: eyebrows, numerais, CTA sobre fundo escuro, hover de links |
| cobre claro | `#D49B5C` | hover do CTA cobre |
| papel | `#F2EDE4` | fundo da página; texto sobre petróleo |
| papel claro | `#FBF9F5` | fundo de seções alternadas e cards |
| branco | `#FFFFFF` | header, fundo de inputs |
| linha | `#DCD4C6` | bordas, divisores, inputs |
| linha suave | `#E6DFD2` | bordas de cards/seções |
| texto secundário | `#48534F` | parágrafos |
| texto terciário | `#6B6358` | eyebrows neutros, legendas |
| placeholder | `#857C70` | |
| erro | `#9A3B2E` | mensagens de erro |

Sobre fundo petróleo, texto secundário usa `rgba(242,237,228,.85–.88)` e divisores `rgba(242,237,228,.2)`.

### Tipografia (Google Fonts)
- **Newsreader** (serif, opsz 6..72, pesos 300/400/500) — títulos, numerais, preços, logotipo.
- **Archivo** (sans, 400/500/600) — corpo, navegação, botões, labels.

```
https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=Archivo:wght@400;500;600&display=swap
```

Escala (fluida via `clamp`):
- H1 hero: Newsreader 300, `clamp(40px,6.6vw,72px)`, lh 1.1, ls -.01em, `text-wrap:balance`
- Provocação ("Mas quem está cuidando…"): Newsreader 300, `clamp(38px,6vw,68px)`, lh 1.06; "vida financeira?" em itálico cobre
- H2 de seção: Newsreader 400, `clamp(30px,4.4vw,46px)`, lh 1.12
- Títulos de card/plano: Newsreader 400, `clamp(26px,2.8vw,32px)`
- Numerais 01–06: Newsreader 300, 44px, cobre
- Preço: Newsreader 400, 42px
- Corpo: Archivo 400, `clamp(15px,1.5vw,17px)`, lh 1.75 (15px/1.7 em cards)
- Eyebrow: Archivo 500, 11px, ls .24em, MAIÚSCULAS (cobre ou `#6B6358`)
- Navegação: Archivo 500, 12px, ls .14em, maiúsculas
- Botões: Archivo 600, 12px (14px no CTA final), ls .16em, maiúsculas
- Labels de formulário: Archivo 500, 11px, ls .2em, maiúsculas, `#6B6358`
- Logotipo "VHG": Newsreader 400, 26px, ls .08em (rodapé: 300, 30px)

### Forma e espaçamento
- **Raio de borda: 0** em tudo (inputs inclusive), exceto a foto (círculo).
- Sem sombras. Hierarquia por fios de 1px e blocos de cor.
- Container: `max-width:1120px`, padding lateral `clamp(20px,5vw,40px)`.
- Padding vertical de seção: `clamp(56px,9vw,100px)` (hero `clamp(72px,12vw,140px)`).
- Fio decorativo cobre: 52×1px.
- Alvos de toque ≥ 44px (menu mobile 52px).

## Telas

### Header (todas as páginas)
Sticky, fundo branco, borda inferior `#DCD4C6`, padding 16px. Esquerda: "VHG" + "PLANEJAMENTO FINANCEIRO" (11px, ls 2.4px, `#6B6358`). Direita (≥1000px): QUEM SOU · O QUE FAÇO · SERVIÇOS · FALE COMIGO (rolam até a âncora descontando a altura do header) · botão contorno "ÁREA DO CLIENTE" · botão sólido petróleo "DIAGNÓSTICO". Abaixo de 1000px: botão hambúrguer 44×44 (3 barras viram X), abre lista vertical com itens de 52px separados por fio, e botão "FAZER O DIAGNÓSTICO" de largura total.

### Home
1. **Hero** — fundo `#123B47`. Eyebrow cobre "PLANEJAMENTO FINANCEIRO PESSOAL 360º"; H1 "Seu Plano de Vida Merece um Plano Financeiro" (max 760px); botões "FAZER O DIAGNÓSTICO" (cobre, texto `#0B2530`) e "VER SERVIÇOS" (contorno papel 60%).
2. **Provocação** — fundo `#FBF9F5`. Grid de 3 (auto-fit, min 240px), cada um com fio superior: "O médico / cuida da sua saúde.", "O dentista / do seu sorriso.", "O nutricionista / da sua alimentação.". Depois frase grande "Mas quem está cuidando da sua *vida financeira?*" + coluna (380px) com fio cobre e texto "Se a resposta for bancos… **sinto lhe informar:** as metas que eles precisam bater não são as mesmas que as suas."
3. **Quem sou** (`#quem-sou`) — foto circular 300px (`assets/vitor.png`) + texto: eyebrow, "Vitor Hugo Germano", "Planejador financeiro" (itálico cobre), parágrafo, lista com fios: PUC-Campinas / Deloitte / 6 anos independente.
4. **O que faço** (`#o-que-faco`) — fundo `#FBF9F5`. Título "Planejamento Financeiro Pessoal 360º" + parágrafo. Grid (min 280px) de 6 etapas com fio superior petróleo, numeral cobre, título 15px/600 e descrição.
5. **Serviços** (`#servicos`) — 3 cards (min 300px, gap 16px, mesma altura):
   - **Pontual** (claro): 3x de R$ 340,00 · R$ 1.020 total · à vista R$ 970; 6 itens com ✓ cobre; botão contorno.
   - **Recorrente** (destaque, fundo petróleo): 12x de R$ 250 · R$ 3.000 total; "TUDO DO PLANO DE 3 MESES, MAIS:" + 2 itens; botão cobre.
   - **Patrimonial** (claro): "PATRIMÔNIO A PARTIR DE R$ 300 MIL"; tabela de taxa anual (1,00% / 0,80% / 0,70% / 0,60% / 0,50% a.a.); "TUDO DO PLANEJAMENTO RECORRENTE, MAIS:" + 3 itens.
   Todos os CTAs: "COMEÇAR PELO DIAGNÓSTICO" → página Formulários.
6. **Fale comigo** (`#fale-comigo`) — fundo petróleo, centralizado. "Vamos conversar sobre o seu plano?" + botão cobre "FAZER O DIAGNÓSTICO" + botão contorno "CHAMAR NO WHATSAPP" (ícone WhatsApp 20px).

### Footer
Fundo `#0B2530`, texto `rgba(242,237,228,.75)`. Colunas: logotipo + fio cobre + "PLANEJAMENTO FINANCEIRO"; contato (nome, germanovitorhugo@gmail.com, +55 14 99643-3289, Botucatu, SP · atendimento online); links (Serviços, Diagnóstico, Área do cliente, @vitorhgermano → instagram.com/vitorhgermano); aviso legal 12px.

### Formulários
Título "Comece aqui. Respondo em até dois dias úteis." Formulário "Pedido de conversa" (card `#FBF9F5`): nome*, e-mail*, WhatsApp, cidade (grid min 200px); select "Momento de vida" (6 opções); chips-checkbox "O que você quer resolver primeiro" (6); textarea; consentimento obrigatório; botão "ENVIAR PEDIDO". Após envio: bloco petróleo "Recebido. Obrigado." + "ENVIAR OUTRA RESPOSTA". Lateral: card petróleo "DEPOIS DO ENVIO" (4 passos), card "OUTROS FORMULÁRIOS" (3 itens informativos), contato direto.

### Área do cliente — Login
Coluna central 440px. "Entrar" + texto; card com e-mail, senha, erro (`#9A3B2E`), botão "ENTRAR" (vira "ENTRANDO…"), link "Esqueci minha senha". Modo reset: "Nova senha", envia link e mostra confirmação genérica. Rodapé: "Ainda não é cliente? Comece pelo pedido de conversa."

### Área do cliente — Painel
"Olá, {primeiro nome}." + e-mail + botão "SAIR". Lista de formulários (card com numeral, título, descrição, barra de progresso 2px e status):
- 01 Ficha cadastral (ainda sem tela → "EM BREVE")
- 02 Diagnóstico financeiro → `Diagnóstico VHG.dc.html`
Status: NÃO INICIADO (`#6B6358`, ação COMEÇAR), EM ANDAMENTO · X% (cobre, CONTINUAR), ENVIADO ✓ (petróleo, VER RESPOSTAS). Lateral "COMO FUNCIONA" (4 passos) + links WhatsApp/e-mail.

### Diagnóstico financeiro (`Diagnóstico VHG.dc.html`)
Tela de abertura (com bloqueio de acesso para não-clientes) + 10 etapas com stepper e navegação Voltar/Continuar ("ENVIAR DIAGNÓSTICO" na última): 1 Identificação · 2 Renda mensal · 3 Despesas · 4 Patrimônio e investimentos · 5 Dívidas · 6 Liquidez e reserva de emergência · 7 Gestão de risco · 8 Aposentadoria e metas · 9 Situação atual · 10 Revisão e finalização. Campos e textos completos no arquivo. Deve salvar progresso (pausar e continuar).

### Relatório (`Relatório VHG.dc.html`)
13 seções: Capa · Abertura · Score e maturidade · Arquétipo · Indicadores · Distribuição de despesas · Score por dimensão · Projeção da aposentadoria · Plano de ação · Checklist 30 dias · Glossário · Próximo passo (plano recomendado) · Encerramento. Dados atuais são de exemplo ("Mariana"); os cálculos originais estão em `diagnostico-relatorio.html` no repo hz-invest. Tem botão "imprimir/PDF" (oculto na impressão).

## Interações
- Âncoras do menu: scroll suave com offset da altura do header; fecham o menu mobile.
- Troca de página rola para o topo.
- Breakpoint do menu: 1000px. Demais layouts usam flex-wrap/grid auto-fit (sem breakpoints fixos).
- Hovers: links → cobre; botão petróleo → `#0B2530`; botão cobre → `#D49B5C`; botões contorno → borda/texto cobre ou preenchimento petróleo (cards claros).
- Foco de inputs: borda `#123B47`, sem outline.
- WhatsApp: `https://wa.me/5514996433289?text=Olá, Vitor! Vim pelo site e gostaria de conversar sobre planejamento financeiro.` (URL-encoded).

## Estado / Backend
No protótipo, auth e dados são simulados (localStorage). Substituir por Supabase:
- `auth.signIn` → `supabase.auth.signInWithPassword`
- `auth.signOut` → `supabase.auth.signOut`
- `auth.resetPassword` → `supabase.auth.resetPasswordForEmail`
- `auth.getSession` → `supabase.auth.getSession`
- `loadForms(user)` → select na tabela de respostas: `{ ficha: {status, progress}, diagnostico: {status, progress} }`, status ∈ `nao_iniciado | andamento | enviado`.
- Contas criadas manualmente pelo Vitor após contratação (sem cadastro público).
- Formulário "Pedido de conversa": hoje só mostra confirmação — precisa enviar (e-mail ou tabela `leads`).
- Diagnóstico: salvar respostas por etapa; ao enviar, gerar o relatório.

## Assets
- `design/assets/vitor.png` — foto recortada usada no "Quem sou".
- `design/assets/vitor-retrato.jpg` — retrato alternativo.
- Ícone WhatsApp: SVG inline no arquivo do site.
- Sem logotipo em imagem: "VHG" é tipográfico (Newsreader).

## Arquivos
- `design/Site VHG.dc.html` — site completo (home, formulários, login, painel).
- `design/Diagnóstico VHG.dc.html` — formulário de 10 etapas.
- `design/Relatório VHG.dc.html` — relatório de resultado.
- `design/Manual de marca VHG.dc.html` — referência da identidade visual.
- `design/support.js` — runtime para visualizar os protótipos (não portar).
