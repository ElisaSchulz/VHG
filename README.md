# VHG · Planejamento Financeiro

Site do Vitor Hugo Germano. Inclui a home, o formulário de pedido de conversa, a área do cliente, o diagnóstico financeiro em 10 etapas, o relatório (que pode ser baixado em PDF) e um painel de admin.

O site é **HTML, CSS e JavaScript puro**: não precisa instalar nada nem rodar etapa de build. O **Supabase** cuida de todo o resto: login, banco de dados e regras de acesso.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Home: hero, provocação, Quem sou, O que faço, Serviços, Fale comigo |
| `formularios.html` | Pedido de conversa. As respostas vão para a tabela `leads` |
| `entrar.html` | Login, "esqueci minha senha" e criação de senha (pelo link do convite) |
| `area.html` | Área do cliente: status da ficha e do diagnóstico, e acesso ao relatório |
| `ficha.html` | Ficha cadastral (passo 1 do cliente). Salva sozinha no Supabase |
| `diagnostico.html` | Diagnóstico em 10 etapas, com as mesmas perguntas e a mesma lógica do diagnóstico da HZ. Salva sozinho no Supabase e permite pausar e continuar |
| `relatorio.html` | Relatório em 13 seções, montado na hora a partir das respostas. O botão "Baixar PDF" usa a impressão do navegador |
| `admin.html` | Painel do admin: clientes, fichas, diagnósticos, liberação de relatórios e pedidos de conversa. Permite editar o nome dos clientes e editar, adicionar ou apagar contatos, com anotações internas |
| `politica-privacidade.html` | Política de privacidade (revise o texto antes de publicar) |

Para ver um relatório de exemplo sem precisar de banco: `relatorio.html?demo`.

## Como funciona o fluxo

1. A pessoa envia o **pedido de conversa**. O pedido aparece no painel do admin, na aba "Pedidos de conversa".
2. Depois da contratação, o Vitor **convida o cliente** pelo Supabase. O cliente recebe um e-mail, cria a senha e entra.
3. No primeiro login, o cliente cai direto na **ficha cadastral**. Ao enviá-la, o nome informado vira o nome do perfil (e o "Display name" no Supabase). O diagnóstico só abre depois que a ficha é enviada, e já vem com os dados de identificação preenchidos a partir dela.
4. O cliente responde o **diagnóstico**. Cada alteração é salva automaticamente, então dá para parar e continuar depois. Ao final, ele clica em "Enviar diagnóstico".
5. No painel, o Vitor abre o **relatório** (com o design do site) e, quando quiser, clica em **Liberar**. A partir daí o cliente vê o relatório na área dele e pode baixar o PDF.

No banco ficam guardados **só os dados das respostas**. O relatório não é salvo como arquivo: ele é gerado de novo a cada abertura, sempre com o design atual.

## Configurar o Supabase (uma vez só)

1. **Crie o projeto** em [supabase.com](https://supabase.com). A região São Paulo (`sa-east-1`) é a mais próxima.
2. **Crie as tabelas:** rode os cinco arquivos da pasta `supabase/`, **um por vez e na ordem**. Para cada um, abra *SQL Editor › New query*, cole o conteúdo do arquivo inteiro e clique em *Run*:
   1. `1-perfis.sql`
   2. `2-diagnosticos.sql`
   3. `3-leads.sql`
   4. `4-fichas.sql`
   5. `5-admins-e-conferencia.sql`, que no final lista as quatro tabelas criadas.

   Todos podem ser rodados de novo sem perder dados.
3. **Copie as chaves** em *Project Settings › API* para o arquivo `assets/js/config.js` (já preenchido para o projeto atual):
   - *Project URL* vai em `SUPABASE_URL`
   - *Publishable key* vai em `SUPABASE_ANON_KEY`
   - **Nunca** use a *secret key* (ou a antiga `service_role`) no site.
4. **Feche o cadastro público:** em *Authentication › Sign In / Providers › Email*, desligue a opção **"Allow new users to sign up"**. Assim, só entra quem o Vitor convidar.
5. **Informe o endereço do site:** em *Authentication › URL Configuration*:
   - *Site URL*: o endereço principal do site, por exemplo `https://vitorhugogermano.com.br`. Os links de convite e de nova senha chegam nesse endereço, e o site leva a pessoa sozinho para a tela de criar senha.
   - *Redirect URLs*: adicione o mesmo endereço com `/**` no fim (por exemplo `https://vitorhugogermano.com.br/**`). Pode haver mais de um: durante os testes, deixe também o endereço de teste.
   - Ao trocar de endereço (do teste para o definitivo), só estas duas configurações mudam. Nenhum arquivo do site precisa ser alterado.
6. **Crie as contas de admin:** em *Authentication › Users › Add user › Send invitation*, convide `elisacmazzo@gmail.com` e `germanovitorhugo@gmail.com`. Esses dois e-mails já nascem como admin. A lista fica na função `emails_admin()`, em `supabase/1-perfis.sql`: para mudar, edite a lista e rode o arquivo 1 e depois o 5.
7. *(Recomendado)* Em *Authentication › Emails*, traduza os modelos de e-mail ("Invite user" e "Reset password"). Antes de começar a convidar clientes, configure um **SMTP próprio** em *Authentication › Emails › SMTP Settings*: o e-mail padrão do Supabase tem um limite baixo de envios por hora.

### Liberar um novo cliente

Em *Authentication › Users › Add user › Send invitation*, informe o e-mail do cliente. O painel do admin tem um atalho para essa tela.

## Publicar o site

Qualquer hospedagem de arquivos estáticos funciona, porque o site é só um conjunto de arquivos.

- **GitHub Pages:** no repositório, abra *Settings › Pages*, escolha a branch `main` e a pasta `/ (root)`.
- **Netlify ou Vercel:** importe o repositório. Não há comando de build.

Para testar no próprio computador, rode `python3 -m http.server` na pasta do projeto e abra `http://localhost:8000`.

## Organização do código

```
assets/css/vhg.css              design tokens e componentes (cores, tipografia, botões, formulários)
assets/js/config.js             chaves do Supabase e contatos
assets/js/vhg.js                cabeçalho, rodapé, cliente do Supabase e funções de login
assets/js/diagnostico-core.js   regras de cálculo do diagnóstico (score, arquétipo, projeções)
assets/js/exemplo-diagnostico.js respostas fictícias usadas em relatorio.html?demo
assets/css/formulario.css       visual da ficha cadastral e do diagnóstico
supabase/1…5-*.sql              tabelas e regras de segurança (RLS), em cinco partes
design/                         protótipos originais do Claude Design (referência, não publicar)
```

`diagnostico-core.js` foi portado do repositório `ElisaSchulz/hz-invest`. As regras de negócio são as mesmas; mudaram só as cores e o contato.

## Segurança

As regras ficam no próprio banco (RLS), criadas pelos arquivos da pasta `supabase/`:

- **Visitante** (sem login): só consegue *enviar* um pedido de conversa. Não lê nada.
- **Cliente:** lê e edita só a própria ficha e o próprio diagnóstico, e só enquanto não foram enviados. Não consegue liberar o próprio relatório nem se tornar admin.
- **Admin:** lê tudo, libera relatórios, reabre diagnósticos e atualiza o status dos pedidos de conversa.
