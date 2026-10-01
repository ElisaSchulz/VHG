# VHG · Planejamento Financeiro

Site do Vitor Hugo Germano. Inclui a home, o formulário de pedido de conversa, a área do cliente, o diagnóstico financeiro em 10 etapas, o relatório (que pode ser baixado em PDF) e um painel de admin.

O site é **HTML, CSS e JavaScript puro**: não precisa instalar nada nem rodar etapa de build. O **Supabase** cuida de todo o resto: login, banco de dados e regras de acesso.

## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Home: hero, provocação, Quem sou, O que faço, Serviços, Fale comigo |
| `formularios.html` | Pedido de conversa. As respostas vão para a tabela `leads` |
| `entrar.html` | Login, "esqueci minha senha" e criação de senha (pelo link do convite) |
| `area.html` | Área do cliente: status do diagnóstico e acesso ao relatório |
| `diagnostico.html` | Diagnóstico em 10 etapas. Salva sozinho no Supabase e permite pausar e continuar |
| `relatorio.html` | Relatório em 13 seções, montado na hora a partir das respostas. O botão "Baixar PDF" usa a impressão do navegador |
| `admin.html` | Painel do Vitor: clientes, diagnósticos, liberação de relatórios e pedidos de conversa |
| `politica-privacidade.html` | Política de privacidade (revise o texto antes de publicar) |

Para ver um relatório de exemplo sem precisar de banco: `relatorio.html?demo`.

## Como funciona o fluxo

1. A pessoa envia o **pedido de conversa**. O pedido aparece no painel do admin, na aba "Pedidos de conversa".
2. Depois da contratação, o Vitor **convida o cliente** pelo Supabase. O cliente recebe um e-mail, cria a senha e entra na área do cliente.
3. O cliente responde o **diagnóstico**. Cada alteração é salva automaticamente, então dá para parar e continuar depois. Ao final, ele clica em "Enviar diagnóstico".
4. No painel, o Vitor abre o **relatório** (com o design do site) e, quando quiser, clica em **Liberar**. A partir daí o cliente vê o relatório na área dele e pode baixar o PDF.

No banco ficam guardados **só os dados das respostas**. O relatório não é salvo como arquivo: ele é gerado de novo a cada abertura, sempre com o design atual.

## Configurar o Supabase (uma vez só)

1. **Crie o projeto** em [supabase.com](https://supabase.com). A região São Paulo (`sa-east-1`) é a mais próxima.
2. **Crie as tabelas:** no painel, abra *SQL Editor › New query*, cole todo o conteúdo de `supabase/schema.sql` e clique em *Run*. Esse script pode ser rodado de novo sem perder dados.
3. **Copie as chaves** em *Project Settings › API* para o arquivo `assets/js/config.js`:
   - *Project URL* vai em `SUPABASE_URL`
   - *anon public* vai em `SUPABASE_ANON_KEY`
   - **Nunca** use a chave `service_role` no site.
4. **Feche o cadastro público:** em *Authentication › Sign In / Providers › Email*, desligue a opção **"Allow new users to sign up"**. Assim, só entra quem o Vitor convidar.
5. **Informe o endereço do site:** em *Authentication › URL Configuration*:
   - *Site URL*: o endereço do site (por exemplo `https://vhg.com.br/entrar.html`)
   - *Redirect URLs*: adicione `https://SEU-ENDERECO/entrar.html`
6. **Crie a conta do Vitor e torne-a admin:**
   1. Em *Authentication › Users › Add user › Send invitation*, informe `germanovitorhugo@gmail.com`.
   2. O Vitor abre o e-mail e cria a senha.
   3. No *SQL Editor*, rode:
      ```sql
      update public.perfis set papel = 'admin' where email = 'germanovitorhugo@gmail.com';
      ```
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
supabase/schema.sql             tabelas e regras de segurança (RLS)
design/                         protótipos originais do Claude Design (referência, não publicar)
```

`diagnostico-core.js` foi portado do repositório `ElisaSchulz/hz-invest`. As regras de negócio são as mesmas; mudaram só as cores e o contato.

## Segurança

As regras ficam no próprio banco (RLS), em `supabase/schema.sql`:

- **Visitante** (sem login): só consegue *enviar* um pedido de conversa. Não lê nada.
- **Cliente:** lê e edita só o próprio diagnóstico, e só enquanto ele não foi enviado. Não consegue liberar o próprio relatório nem se tornar admin.
- **Admin:** lê tudo, libera relatórios, reabre diagnósticos e atualiza o status dos pedidos de conversa.
