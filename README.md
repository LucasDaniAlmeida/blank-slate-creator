# 1

1. OBJETIVO DO PROJETO

Construir e refinar um sistema web corporativo de Gestão de Projetos, Cobrança e Fiscalização, utilizando o projeto Lovable atual e o banco de dados Supabase já existente.

O sistema será utilizado internamente para gerenciamento de:

 Projetos

 Notificações

 Empresas

 Localidades

 Usuários e permissões

 Auditoria

A prioridade é criar uma aplicação com aparência de sistema corporativo profissional, com excelente organização visual, usabilidade e consistência.

A interface deve parecer desenvolvida por uma equipe profissional de produto e software, e não deve ter aparência genérica de aplicação SaaS gerada por IA.

2. REGRA FUNDAMENTAL — SUPABASE EXISTENTE

O Supabase existente é a fonte de verdade do backend.

NÃO recriar o banco de dados.

NÃO criar tabelas duplicadas.

NÃO criar uma segunda estrutura paralela.

NÃO substituir as tabelas existentes por mocks ou estruturas locais.

Antes de implementar funcionalidades que dependam do banco:

 Inspecionar o schema existente.

 Identificar tabelas, colunas, relacionamentos, triggers, funções e políticas RLS existentes.

 Utilizar a estrutura existente.

 Fazer alterações no banco somente quando forem realmente necessárias e explicitamente justificadas.

O frontend deve ser construído sobre o backend existente.

Não assumir que os nomes das colunas são diferentes dos existentes. Sempre verificar o schema real.

3. CONEXÃO COM SUPABASE

Utilizar a integração existente do Lovable com Supabase / MCP para trabalhar com o projeto Supabase conectado.

Utilizar @supabase/supabase-js no frontend.

O frontend deve utilizar somente credenciais públicas apropriadas para o cliente.

Nunca utilizar service_role, secret keys ou credenciais administrativas no frontend.

O acesso e a segurança dos dados devem continuar sendo controlados pelo Supabase Auth + RLS.

Não criar uma camada de autenticação paralela.

Não armazenar permissões importantes apenas no frontend.

4. AUTENTICAÇÃO

Utilizar o Supabase Auth.

Criar:

/login

 logout

 controle de sessão

 proteção das rotas internas

 redirecionamento para login quando não autenticado

Depois do login, carregar o usuário correspondente na tabela:

public.usuarios

e seu perfil em:

public.perfis_acesso

A interface deve conhecer o perfil do usuário e adaptar menus, botões e ações disponíveis.

Entretanto, a segurança real nunca deve depender apenas da interface. As políticas RLS existentes no Supabase continuam sendo a camada de segurança definitiva.

5. PERFIS DE ACESSO

Existem quatro perfis:

 Administrador

 Analista

 Operador

 Visualizador

Respeitar a seguinte matriz:

Administrador

Acesso completo ao sistema.

Pode:

 visualizar

 criar

 editar

 excluir quando permitido

 gerenciar usuários

 alterar permissões

 acessar auditoria

Analista

Pode:

 visualizar projetos

 criar projetos

 editar projetos

 visualizar empresas

 visualizar localidades

 criar notificações

 editar notificações

 visualizar auditoria

Operador

Pode:

 visualizar projetos

 criar projetos

 editar projetos

 criar empresas

 editar empresas

 criar localidades

 editar localidades

 criar notificações

 editar notificações

 visualizar auditoria

Visualizador

Acesso somente leitura aos recursos permitidos.

Não deve visualizar botões de criação, edição ou exclusão quando não possuir permissão.

6. ESTRUTURA PRINCIPAL DA APLICAÇÃO

Criar as seguintes rotas:

/login

/

/projetos

/projetos/novo

/projetos/:id

/notificacoes

/notificacoes/novo

/notificacoes/:id

/empresas

/empresas/novo

/empresas/:id

/localidades

/usuarios

/auditoria

7. MENU LATERAL

Criar sidebar corporativa, escura, compacta e elegante.

Estrutura:

Dashboard

Operação

 Projetos

 Notificações

Cadastros

 Empresas

 Localidades

Administração

 Usuários

 Auditoria

O menu deve respeitar as permissões do usuário.

A opção atualmente selecionada deve possuir destaque visual claro.

No rodapé da sidebar:

 avatar

 nome do usuário

 perfil

 opção de logout

8. REFERÊNCIA VISUAL

Utilizar a imagem de referência fornecida pelo usuário como referência de linguagem visual, composição e hierarquia, e não como algo para copiar literalmente.

A interface deve seguir estes princípios:

 sidebar escura;

 conteúdo principal claro;

 fundo muito claro;

 bastante espaço em branco;

 azul como cor principal de interação;

 verde, amarelo e vermelho somente para estados e indicadores;

 cards discretos;

 bordas sutis;

 cantos moderadamente arredondados;

 sombras muito leves;

 tabelas limpas;

 linhas discretas;

 tipografia corporativa;

 ícones pequenos e consistentes;

 filtros bem organizados;

 botões claros e objetivos.

Evitar:

 gradientes exagerados;

 excesso de sombras;

 glassmorphism;

 cards gigantes;

 excesso de ícones;

 animações desnecessárias;

 elementos decorativos sem função;

 aparência de landing page;

 aparência de template genérico de SaaS;

 excesso de roxo ou cores típicas de interfaces geradas por IA.

O sistema deve transmitir controle, confiabilidade, organização e eficiência operacional.

9. REGRA MAIS IMPORTANTE DE UX — DASHBOARD ≠ TABELAS

Separar visualmente e funcionalmente o Dashboard das telas de gerenciamento.

O Dashboard é uma tela analítica.

As telas de Projetos, Notificações, Empresas, Localidades e Usuários são telas de gerenciamento/listagem.

Não transformar todas as páginas em dashboards.

10. DASHBOARD

O / deve ser uma visão geral da operação.

Utilizar:

 cards de KPI;

 gráficos;

 distribuição por status;

 evolução temporal;

 indicadores;

 últimas atividades;

 informações resumidas.

Os dados devem vir do Supabase.

Não utilizar dados mockados.

O Dashboard pode possuir cards mais ricos e gráficos.

Exemplos:

Projetos

 Total de projetos

 Em dia

 Em atraso

 Com pendências

Notificações

 Total

 Em dia

 Em andamento

 Atrasadas

Utilizar os dados reais das tabelas.

11. TELAS DE TABELA

Todas as principais telas de listagem devem seguir uma estrutura consistente:

Título + descrição

Cards-resumo

Busca e filtros

Tabela

Paginação

Os cards existem para fornecer contexto rápido sobre a lista.

Eles devem ser mais compactos que os cards do Dashboard.

Não colocar gráficos dentro desses cards.

Não transformar essas páginas em dashboards.

12. CARDS NAS TELAS DE TABELA

Projetos

Criar cards como:

 Total de Projetos

 Em andamento / Em dia

 Em atraso

 Pendentes

Os números devem ser calculados a partir dos dados reais.

Notificações

Criar cards como:

 Total de Notificações

 Em dia

 Em andamento

 Atrasadas

Empresas

Criar cards como:

 Total de Empresas

 Ativas

 Inativas

 Com projetos

Usuários

Criar cards como:

 Total de Usuários

 Ativos

 Administradores

 Analistas

Localidades

Criar cards coerentes com os dados disponíveis, por exemplo:

 Total de Localidades

 Estados

 Regionais

 Polos

Os cards devem ser compactos, elegantes e informativos.

13. PROJETOS

Utilizar a tabela:

public.projetos

Relacionamentos:

empresa_id → public.empresas

localidade_id → public.localidades

analista_id → public.usuarios

status_cobranca_id → public.status_cobranca

status_fiscalizacao_id → public.status_fiscalizacao

Campos importantes:

 número do projeto

 empresa

 localidade

 número contrato SIGUM

 solicitante

 data de abertura

 data de resposta

 analista

 quantidade de postes

 data de início da cobrança

 status da cobrança

 número do chamado

 data de atualização SIGUM

 data de fiscalização

 status da fiscalização

 observações

 projeto cadastrado

Na tabela, mostrar as informações mais relevantes e utilizar badges para status.

Criar busca, filtros, ordenação e paginação.

O formulário de projeto deve utilizar selects/autocomplete alimentados pelas tabelas relacionadas.

Não hardcodar empresas, localidades, usuários ou status.

14. NOTIFICAÇÕES

Utilizar:

public.notificacoes

Uma notificação pode ou não estar vinculada a um projeto.

Portanto:

projeto_id é opcional.

Campos:

 número da notificação

 ano

 número sequencial

 projeto

 protocolo de faturamento

 data de verificação de revelia

 data de retirada de adequação PE

 quantidade de dias de ocupação

 data de abertura do protocolo de faturamento

 quantidade de pontos

 valor arrecadado

 empresa notificada

 observação

REGRA CRÍTICA DE NUMERAÇÃO

O campo numero_notificacao é gerado automaticamente pelo banco.

Nunca gerar o número da notificação no JavaScript.

Nunca permitir que o usuário edite o número.

O banco gera a numeração no formato:

01_2026

02_2026

03_2026

etc.

A numeração é reiniciada anualmente:

01_2027

02_2027

etc.

O frontend deve simplesmente inserir a notificação e depois utilizar o número retornado pelo banco.

15. EMPRESAS

Utilizar:

public.empresas

Campos:

 CNPJ

 nome comercial

 nome fantasia

 número SIGUM

 código do contrato

 UC

 e-mails

 contatos

 responsável

 endereço de correspondência

Criar tela de listagem com:

 cards-resumo

 busca

 filtros

 tabela

 paginação

 ações

Formatação de CNPJ deve ser brasileira.

E-mails e contatos devem ser apresentados de forma organizada.

16. LOCALIDADES

Utilizar:

public.localidades

Campos:

 cidade

 polo

 regional

 estado

Criar tela de gerenciamento seguindo o mesmo padrão das demais tabelas.

Utilizar filtros para:

 cidade

 estado

 polo

 regional

17. USUÁRIOS

A tela /usuarios deve ser exclusiva para administradores.

Utilizar:

public.usuarios

e:

public.perfis_acesso

Mostrar:

 nome

 matrícula

 cargo

 perfil

 status

 último acesso, quando essa informação estiver disponível

Criar interface para o administrador:

 visualizar usuários

 alterar perfil

 ativar/desativar usuário

 editar informações permitidas

Não expor funcionalidades administrativas para outros perfis.

Não implementar exclusão direta de usuário do Auth pelo frontend.

Se uma operação administrativa de Auth for necessária, utilizar uma abordagem segura server-side apropriada.

18. AUDITORIA

Utilizar:

public.audit_logs

A auditoria registra alterações realizadas nas entidades do sistema.

Criar tela /auditoria.

Mostrar:

 data/hora

 usuário

 tabela

 registro

 ação

 campos alterados

Permitir filtros por:

 usuário

 tabela

 ação

 período

Quando possível, permitir abrir o detalhe da alteração mostrando os valores anterior e novo de forma organizada.

Não criar logs manualmente no frontend para substituir o mecanismo existente.

O banco já possui mecanismo de auditoria.

19. STATUS

Não hardcodar status quando eles já existirem no banco.

Utilizar:

public.status_cobranca

public.status_fiscalizacao

Os status devem ser carregados dinamicamente.

O mesmo vale para perfis de acesso:

public.perfis_acesso

20. TABELAS

As tabelas devem ser profissionais e densas o suficiente para uso operacional, sem ficarem visualmente poluídas.

Utilizar:

 cabeçalho fixo quando fizer sentido;

 ordenação;

 paginação;

 busca;

 filtros;

 badges;

 ações por registro;

 estados vazios;

 loading states;

 mensagens de erro;

 confirmação antes de ações destrutivas.

Evitar tabelas com dezenas de colunas espremidas.

Quando houver muitos campos, mostrar os principais na tabela e deixar detalhes para a tela do registro.

21. BUSCA E FILTROS

Criar componentes reutilizáveis de:

 campo de busca

 select

 multi-select quando necessário

 filtro por status

 filtro por período

 limpar filtros

A busca deve ser realmente funcional e consultar os dados reais.

Não criar filtros meramente decorativos.

22. FORMULÁRIOS

Formulários devem:

 possuir labels claras;

 indicar campos obrigatórios;

 validar dados;

 apresentar mensagens de erro compreensíveis;

 utilizar máscaras brasileiras quando aplicável;

 possuir estados de carregamento;

 impedir envio duplicado;

 informar sucesso após salvar.

Usar componentes consistentes em todo o sistema.

23. FORMATAÇÃO BRASILEIRA

Utilizar:

 datas no padrão dd/mm/aaaa;

 data/hora no padrão brasileiro;

 valores monetários em R$;

 números formatados em português do Brasil;

 CNPJ com máscara;

 campos de telefone/e-mail adequadamente apresentados.

Não alterar o valor armazenado no banco apenas para fins de apresentação.

24. ESTADOS DA INTERFACE

Todas as páginas que carregam dados devem possuir:

 loading state;

 empty state;

 error state;

 sucesso;

 feedback de operações.

Exemplo de empty state:

“Nenhum projeto encontrado.”

Em vez de deixar uma tabela simplesmente vazia.

25. ARQUITETURA DO FRONTEND

Utilizar:

 React

 TypeScript

 Vite

 Supabase JS

Criar arquitetura organizada.

Separar:

 páginas

 componentes

 hooks

 serviços

 tipos

 utilitários

 autenticação

 autorização

Evitar colocar toda a lógica em componentes gigantes.

Criar componentes reutilizáveis para:

 cards

 tabelas

 filtros

 badges

 modais

 formulários

 estados de carregamento

 confirmação

 paginação

26. DADOS REAIS

Não usar mock data para representar o sistema final.

Não criar arrays falsos de projetos, empresas, notificações ou usuários apenas para preencher a interface.

Todas as informações exibidas devem vir do Supabase.

Durante desenvolvimento, se for necessário testar estados vazios ou carregamento, utilizar mecanismos próprios de desenvolvimento sem contaminar a aplicação final com dados fictícios.

27. PERFORMANCE

Evitar carregar todos os registros desnecessariamente.

Utilizar:

 paginação;

 queries filtradas;

 selects específicos;

 relacionamentos adequados;

 debounce em pesquisas quando necessário.

Não fazer chamadas repetidas ao banco sem necessidade.

28. RESPONSIVIDADE

O sistema é prioritariamente para desktop, mas deve funcionar adequadamente em resoluções menores.

Em telas menores:

 sidebar pode ser recolhida;

 tabelas podem possuir scroll horizontal;

 filtros devem se reorganizar;

 cards devem se adaptar.

Não comprometer a experiência desktop para tentar transformar o sistema em aplicativo mobile.

29. MICROINTERAÇÕES

Utilizar animações somente quando melhorarem a experiência.

Exemplos:

 abertura de modal;

 mudança de página;

 feedback de salvamento;

 expansão de detalhes.

Evitar animações decorativas.

A interface deve parecer rápida e profissional.

30. REGRA CONTRA “CARA DE IA”

O resultado final não deve parecer um template produzido automaticamente.

Evitar:

 excesso de cards;

 excesso de arredondamento;

 gradientes;

 textos genéricos;

 títulos exageradamente grandes;

 ícones enormes;

 sombras pesadas;

 espaçamentos inconsistentes;

 cores demais;

 dashboards em todas as páginas;

 componentes visualmente chamativos sem necessidade.

Priorizar:

hierarquia, densidade de informação, clareza, consistência e eficiência operacional.

O usuário deve sentir que está utilizando um sistema interno corporativo maduro.

31. ESTRUTURA VISUAL PADRÃO

Todas as páginas internas devem seguir aproximadamente:

SIDEBAR
│
└── CONTEÚDO
     │
     ├── Header superior
     │    ├── Busca global
     │    ├── Notificações
     │    └── Usuário
     │
     ├── Título da página
     ├── Descrição
     │
     ├── Cards-resumo
     │
     ├── Área de filtros
     │
     ├── Tabela
     │
     └── Paginação

No Dashboard, substituir a estrutura de tabela por:

Título
│
├── KPIs
│
├── Gráficos
│
├── Indicadores
│
└── Últimas atividades

32. AÇÕES

Botões de ação devem ser claros:

 Novo Projeto

 Nova Notificação

 Nova Empresa

 Nova Localidade

Ações secundárias podem utilizar ícones.

Não esconder ações importantes atrás de menus desnecessários.

33. SEGURANÇA

Nunca confiar apenas no frontend para autorização.

O frontend deve esconder funcionalidades sem permissão para melhorar UX, mas o Supabase RLS continua sendo a autoridade de segurança.

Não expor:

 service role;

 secrets;

 credenciais administrativas;

 funções administrativas diretamente ao navegador.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6299888d-bd00-4816-8d82-94f2edf3fc73).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
