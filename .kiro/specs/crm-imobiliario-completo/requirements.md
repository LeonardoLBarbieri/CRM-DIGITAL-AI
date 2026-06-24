# Documento de Requisitos

## Introduction

Expansão massiva do sistema **LB Digital AI** — um CRM imobiliário com IA já existente, construído em Next.js (App Router) + TypeScript + Prisma + SQLite. O sistema atual possui gestão básica de leads (CRUD), controle financeiro de comissões e ferramentas de IA para geração de roteiros, voz (ElevenLabs) e avatar (HeyGen).

Esta expansão transforma o sistema em um **CRM Imobiliário Enterprise Completo**, adicionando: integração com WhatsApp Business API, painel Kanban com drag-and-drop, ficha completa do cliente, classificação de temperatura de leads, sistema de tarefas e lembretes, dashboard gerencial com métricas, campanhas de disparo em massa, automações inteligentes, redesign premium da interface e assistente de IA especializado em vendas imobiliárias.

---

## Glossary

- **CRM**: Customer Relationship Management — sistema de gestão de relacionamento com clientes/leads.
- **Lead**: Potencial cliente capturado pelo corretor.
- **Sistema**: O conjunto de software LB Digital AI (Next.js + Prisma + SQLite) sendo expandido.
- **WhatsApp_Gateway**: Módulo responsável por toda comunicação com a API do WhatsApp Business.
- **Kanban_Board**: Componente visual de painel com colunas e cartões arrastáveis.
- **Lead_Card**: Representação visual de um lead no painel Kanban.
- **Ficha_Cliente**: Tela de detalhes completos de um lead/cliente.
- **Temperatura**: Classificação qualitativa do grau de interesse de um lead (Frio, Morno, Quente, Prioritário).
- **Tarefa**: Ação pendente associada a um lead (ligar, enviar proposta, confirmar visita, etc.).
- **Dashboard**: Painel gerencial com métricas e gráficos de desempenho.
- **Campanha**: Disparo programado ou imediato de mensagens WhatsApp para uma lista de leads.
- **Automação**: Regra de negócio executada automaticamente quando um evento ocorre.
- **Assistente_IA**: Módulo de inteligência artificial (OpenAI GPT-4o-mini) integrado ao CRM.
- **Horário_Comercial**: Período configurado como seg–sex 08:00–18:00, sáb 08:00–12:00.
- **Status_Kanban**: Uma das 12 etapas do funil de vendas: Lead Novo, Primeiro Contato, Qualificação, Em Negociação, Visita Agendada, Visita Realizada, Proposta Enviada, Aguardando Resposta, Reserva Efetuada, Contrato Assinado, Venda Concluída, Lead Perdido.
- **Webhook**: Endpoint HTTP que recebe notificações em tempo real do WhatsApp Business API.
- **Variável_Dinamica**: Placeholder em mensagens substituído por dados reais do lead (ex: `{nome}`).

---

## Requirements

### Requirement 1: Integração WhatsApp Business API — Recepção de Mensagens

**User Story:** Como corretor de imóveis, quero receber mensagens do WhatsApp diretamente no CRM, para que novos leads sejam capturados e atendidos automaticamente sem intervenção manual.

#### Critérios de Aceitação

1. WHEN o WhatsApp_Gateway recebe uma requisição POST no endpoint `/api/whatsapp/webhook`, THE Sistema SHALL verificar a autenticidade da requisição usando o token de verificação configurado na variável de ambiente `WHATSAPP_VERIFY_TOKEN`.
2. WHEN o WhatsApp_Gateway recebe uma mensagem de um número de telefone que não possui cadastro no Sistema, THE Sistema SHALL criar automaticamente um novo registro de Lead com `name` igual ao nome do perfil do remetente (ou o número de telefone formatado caso o nome não esteja disponível), `phone` igual ao número formatado no padrão E.164, e `status` igual a "Lead Novo".
3. WHEN o WhatsApp_Gateway recebe qualquer mensagem de um lead já cadastrado, THE Sistema SHALL registrar a mensagem no histórico de conversas associado ao lead, incluindo o conteúdo da mensagem, o remetente ("lead"), e o timestamp de recebimento.
4. WHEN uma nova mensagem de um lead é recebida, THE Sistema SHALL marcar a conversa do lead como contendo mensagens não lidas.
5. IF o WhatsApp_Gateway receber uma requisição de verificação de webhook com parâmetro `hub.mode` igual a `subscribe` e `hub.verify_token` correto, THEN THE WhatsApp_Gateway SHALL responder com o valor de `hub.challenge` e status HTTP 200.
6. IF o token de verificação recebido no webhook não corresponder ao `WHATSAPP_VERIFY_TOKEN` configurado, THEN THE WhatsApp_Gateway SHALL responder com status HTTP 403 e rejeitar a requisição.

---

### Requirement 2: Mensagens Automáticas WhatsApp

**User Story:** Como corretor de imóveis, quero que novos leads e leads fora do horário comercial recebam mensagens automáticas, para que nenhum cliente fique sem resposta e minha marca seja preservada.

#### Critérios de Aceitação

1. WHEN o Sistema cria um novo Lead a partir de uma mensagem WhatsApp recebida, THE WhatsApp_Gateway SHALL enviar automaticamente a mensagem de boas-vindas: "Olá, tudo bem? Meu nome é Leonardo Barbieri, corretor de imóveis. Recebi sua mensagem e em breve irei atendê-lo. Enquanto isso, fique à vontade para me informar qual imóvel procura e sua região de interesse."
2. WHEN o WhatsApp_Gateway recebe uma mensagem de qualquer lead e o horário atual está fora do Horário_Comercial, THE WhatsApp_Gateway SHALL enviar automaticamente uma mensagem de ausência configurável pelo corretor no painel de configurações.
3. WHEN o corretor acessa as configurações do Sistema, THE Sistema SHALL permitir que o corretor edite e salve o texto da mensagem de ausência fora do Horário_Comercial.
4. THE Sistema SHALL considerar como Horário_Comercial os períodos: segunda a sexta das 08:00 às 18:00 e sábado das 08:00 às 12:00, no fuso horário configurado.
5. WHEN o corretor acessa as configurações do Sistema, THE Sistema SHALL permitir configurar o fuso horário para cálculo do Horário_Comercial.
6. IF o envio automático da mensagem de boas-vindas falhar por erro da API do WhatsApp, THEN THE Sistema SHALL registrar o erro no log e marcar o lead com flag de `mensagemBoasVindasPendente` para nova tentativa.

---

### Requirement 3: Envio de Mensagens pelo CRM

**User Story:** Como corretor de imóveis, quero responder mensagens WhatsApp diretamente pelo CRM, para que eu possa gerenciar todas as conversas em um único lugar sem abrir o aplicativo WhatsApp.

#### Critérios de Aceitação

1. WHEN o corretor acessa a Ficha_Cliente de um lead, THE Sistema SHALL exibir o histórico completo de conversas WhatsApp do lead em ordem cronológica, distinguindo visualmente mensagens enviadas pelo corretor das mensagens enviadas pelo lead.
2. WHEN o corretor digita uma mensagem na caixa de texto da conversa e confirma o envio, THE WhatsApp_Gateway SHALL enviar a mensagem para o número WhatsApp do lead via API.
3. WHEN a mensagem é enviada com sucesso pelo WhatsApp_Gateway, THE Sistema SHALL registrar a mensagem no histórico de conversas com remetente "broker", conteúdo da mensagem e timestamp do envio.
4. IF o envio da mensagem falhar por erro da API do WhatsApp, THEN THE Sistema SHALL exibir uma notificação de erro para o corretor e manter a mensagem na caixa de entrada para reenvio.
5. WHEN o corretor abre a conversa de um lead com mensagens não lidas, THE Sistema SHALL marcar as mensagens como lidas e atualizar o contador de não lidas.
6. WHILE o corretor está com a Ficha_Cliente de um lead aberta, THE Sistema SHALL atualizar o histórico de conversas automaticamente ao receber novas mensagens daquele lead, sem necessidade de recarregar a página.

---

### Requirement 4: Painel Kanban com Drag-and-Drop

**User Story:** Como corretor de imóveis, quero visualizar e mover meus leads em um painel Kanban interativo, para que eu possa gerenciar visualmente o pipeline de vendas e identificar gargalos no funil.

#### Critérios de Aceitação

1. THE Kanban_Board SHALL exibir os leads organizados em exatamente 12 colunas, nesta ordem: "Lead Novo", "Primeiro Contato", "Qualificação", "Em Negociação", "Visita Agendada", "Visita Realizada", "Proposta Enviada", "Aguardando Resposta", "Reserva Efetuada", "Contrato Assinado", "Venda Concluída", "Lead Perdido".
2. WHEN o corretor arrasta um Lead_Card de uma coluna para outra no Kanban_Board, THE Sistema SHALL atualizar o `status` do lead para o Status_Kanban correspondente à coluna de destino e persistir a alteração no banco de dados.
3. WHEN o status de um lead é alterado (por drag-and-drop ou qualquer outro meio), THE Sistema SHALL registrar a movimentação no histórico do lead com o status de origem, status de destino, e timestamp da alteração.
4. WHEN o corretor visualiza o Kanban_Board, THE Sistema SHALL exibir em cada Lead_Card o nome do lead, a Temperatura do lead (com sua cor correspondente), e o número de tarefas pendentes daquele lead.
5. WHEN o corretor clica em um Lead_Card no Kanban_Board, THE Sistema SHALL abrir a Ficha_Cliente completa do lead.
6. THE Kanban_Board SHALL exibir o número total de leads em cada coluna no cabeçalho da respectiva coluna.
7. WHEN o Kanban_Board é carregado, THE Sistema SHALL renderizar todos os leads do corretor distribuídos em suas respectivas colunas de acordo com o `status` de cada lead.

---

### Requirement 5: Ficha Completa do Cliente

**User Story:** Como corretor de imóveis, quero cadastrar e visualizar todas as informações relevantes de cada lead em uma ficha detalhada, para que eu possa qualificá-lo corretamente e personalizar meu atendimento.

#### Critérios de Aceitação

1. THE Sistema SHALL armazenar os seguintes dados pessoais do lead: nome completo, telefone fixo, número de WhatsApp, email, cidade, bairro.
2. THE Sistema SHALL armazenar o seguinte perfil financeiro do lead: faixa de renda mensal (seleção por faixas pré-definidas), se possui FGTS disponível (booleano), se possui entrada disponível (booleano), valor estimado da entrada (numérico), se possui financiamento pré-aprovado (booleano).
3. THE Sistema SHALL armazenar o seguinte perfil de interesse imobiliário do lead: tipo de imóvel pretendido (apartamento, casa, cobertura, comercial — múltipla seleção), faixa de área privativa desejada (m²), faixa de preço de interesse (mínimo e máximo), região de interesse (texto livre), número de quartos desejados, número de vagas de garagem desejadas, nome do empreendimento de interesse (texto livre).
4. WHEN o corretor salva alterações na Ficha_Cliente, THE Sistema SHALL persistir todas as alterações no banco de dados e exibir confirmação visual de sucesso.
5. WHEN o corretor acessa a Ficha_Cliente de um lead, THE Sistema SHALL exibir, além dos dados cadastrais, o histórico de movimentações de status, o histórico de conversas WhatsApp, e a lista de tarefas associadas ao lead.
6. IF o corretor tentar salvar a Ficha_Cliente sem preencher o campo `nome`, THEN THE Sistema SHALL impedir o salvamento e exibir mensagem de validação indicando que o nome é obrigatório.

---

### Requirement 6: Classificação de Temperatura do Lead

**User Story:** Como corretor de imóveis, quero classificar meus leads por temperatura de interesse, para que eu possa priorizar meu tempo e esforços nos leads com maior probabilidade de conversão.

#### Critérios de Aceitação

1. THE Sistema SHALL suportar exatamente quatro valores de Temperatura: "Frio" (representado pela cor azul), "Morno" (representado pela cor amarela), "Quente" (representado pela cor laranja), "Prioritário" (representado pela cor vermelha).
2. WHEN o corretor seleciona uma Temperatura para um lead na Ficha_Cliente ou no Lead_Card do Kanban_Board, THE Sistema SHALL atualizar e persistir a Temperatura do lead no banco de dados.
3. WHEN um novo lead é criado (manualmente ou via WhatsApp), THE Sistema SHALL atribuir automaticamente a Temperatura "Frio" como valor padrão.
4. WHEN o Sistema exibe um Lead_Card no Kanban_Board, THE Sistema SHALL aplicar um indicador visual colorido correspondente à Temperatura do lead de acordo com as cores definidas no Requisito 6.1.
5. WHEN o corretor acessa a Ficha_Cliente, THE Sistema SHALL exibir a Temperatura atual do lead com sua cor correspondente e permitir alteração com um único clique.

---

### Requirement 7: Sistema de Tarefas e Lembretes

**User Story:** Como corretor de imóveis, quero criar e gerenciar tarefas associadas a cada lead, para que eu nunca esqueça um compromisso importante e mantenha meu atendimento organizado.

#### Critérios de Aceitação

1. WHEN o corretor cria uma nova tarefa para um lead, THE Sistema SHALL armazenar a tarefa com os campos: título da tarefa, tipo (Ligar, Enviar Proposta, Confirmar Visita, Enviar Documentos, Outro), data e hora de vencimento, e referência ao lead associado.
2. WHEN a data e hora de vencimento de uma tarefa é atingida ou ultrapassada e a tarefa não está marcada como concluída, THE Sistema SHALL exibir um alerta visual na interface indicando a tarefa em atraso.
3. WHEN o corretor acessa o Dashboard ou qualquer tela principal do Sistema, THE Sistema SHALL exibir um painel de tarefas com três seções: "Atrasadas" (vencimento anterior ao momento atual), "Hoje" (vencimento no dia atual), e "Próximos Compromissos" (vencimento nos próximos 7 dias).
4. WHEN o corretor marca uma tarefa como concluída, THE Sistema SHALL atualizar o status da tarefa para "concluída" e removê-la das listas de pendências.
5. WHEN o corretor acessa a Ficha_Cliente de um lead, THE Sistema SHALL exibir todas as tarefas associadas a esse lead, incluindo as concluídas e as pendentes.
6. IF o corretor tentar criar uma tarefa sem preencher o título e a data de vencimento, THEN THE Sistema SHALL impedir o salvamento e exibir mensagem de validação.
7. WHEN uma nova tarefa é criada para um lead que está no status "Visita Agendada", THE Sistema SHALL exibir sugestão automática do tipo "Confirmar Visita" pré-selecionado.

---

### Requirement 8: Dashboard Gerencial

**User Story:** Como corretor de imóveis, quero visualizar métricas e gráficos de desempenho do meu negócio em um dashboard, para que eu possa tomar decisões estratégicas baseadas em dados reais.

#### Critérios de Aceitação

1. THE Dashboard SHALL exibir os seguintes indicadores numéricos atualizados: total de leads cadastrados, leads recebidos no dia atual, leads recebidos na semana atual (segunda a domingo), leads recebidos no mês atual.
2. THE Dashboard SHALL exibir os seguintes indicadores de pipeline: número de visitas agendadas (leads no status "Visita Agendada"), número de visitas realizadas (status "Visita Realizada"), número de propostas enviadas (status "Proposta Enviada"), número de vendas concluídas no mês atual (leads que chegaram ao status "Venda Concluída" no mês corrente).
3. THE Dashboard SHALL calcular e exibir a taxa de conversão do funil como a razão entre o número de leads com status "Venda Concluída" e o total de leads, expresso em percentual com uma casa decimal.
4. THE Dashboard SHALL exibir gráficos interativos de: evolução de leads recebidos por semana (últimas 8 semanas), distribuição de leads por Status_Kanban (gráfico de barras ou pizza), e distribuição de leads por Temperatura (gráfico de barras ou pizza).
5. WHEN o corretor seleciona um período diferente nos filtros do Dashboard, THE Sistema SHALL recalcular e atualizar todas as métricas e gráficos para o período selecionado.
6. THE Dashboard SHALL exibir o total de receita estimada (soma dos `budgets` dos leads com status "Venda Concluída" no período) e a receita realizada (soma das comissões com type "income" no período).

---

### Requirement 9: Disparos em Massa pelo WhatsApp

**User Story:** Como corretor de imóveis, quero enviar mensagens WhatsApp em massa para listas de leads segmentados, para que eu possa fazer campanhas de marketing e reativação de forma eficiente.

#### Critérios de Aceitação

1. WHEN o corretor acessa o módulo de Campanhas, THE Sistema SHALL permitir criar uma nova campanha com: nome da campanha, mensagem com suporte a Variáveis_Dinamicas, data e hora de envio programado (ou envio imediato), e critérios de segmentação.
2. THE Sistema SHALL suportar as seguintes Variáveis_Dinamicas nas mensagens de campanha: `{nome}` (nome do lead), `{telefone}` (telefone do lead), `{empreendimento}` (empreendimento de interesse do lead).
3. WHEN o corretor configura os critérios de segmentação de uma campanha, THE Sistema SHALL permitir filtrar leads por: Temperatura, Status_Kanban, empreendimento de interesse, e presença de número WhatsApp válido.
4. WHEN o corretor importa um arquivo CSV ou Excel para uma campanha, THE Sistema SHALL ler os campos `nome` e `telefone` de cada linha e adicionar os contatos à lista da campanha, reportando o número de contatos importados com sucesso e o número de linhas com erro.
5. WHEN o horário programado de uma campanha é atingido, THE Sistema SHALL iniciar os disparos para todos os leads segmentados, substituindo as Variáveis_Dinamicas pelos dados reais de cada lead.
6. WHEN uma campanha está em execução, THE Sistema SHALL exibir o progresso em tempo real: número total de destinatários, mensagens enviadas com sucesso, e mensagens com falha.
7. IF um lead na lista de uma campanha não possuir número de WhatsApp cadastrado, THEN THE Sistema SHALL pular esse lead, registrar como "sem WhatsApp", e continuar o disparo para os demais.
8. THE Sistema SHALL respeitar um intervalo mínimo de 3 segundos entre cada mensagem enviada dentro de uma campanha para evitar bloqueio pela API do WhatsApp.

---

### Requirement 10: Automações Inteligentes

**User Story:** Como corretor de imóveis, quero que o sistema execute ações automáticas baseadas em eventos, para que eu economize tempo e nenhum lead fique sem acompanhamento.

#### Critérios de Aceitação

1. WHEN um novo Lead é criado a partir de uma mensagem WhatsApp recebida, THE Sistema SHALL executar automaticamente na seguinte ordem: (a) criar o cadastro do lead, (b) enviar a mensagem de boas-vindas, (c) criar uma tarefa do tipo "Ligar" com vencimento em 30 minutos, (d) definir o status do lead como "Lead Novo".
2. WHEN um lead permanece sem nenhuma mensagem enviada pelo corretor por um período superior a 48 horas após o último contato (mensagem recebida ou enviada), THE Sistema SHALL criar automaticamente uma tarefa de follow-up para o lead com título "Follow-up automático — sem resposta há 48h".
3. WHEN o corretor acessa as configurações de automação, THE Sistema SHALL permitir configurar o período de inatividade (em horas) que aciona a tarefa de follow-up automático, com valor padrão de 48 horas.
4. WHEN uma Automação é executada, THE Sistema SHALL registrar no log de auditoria: o tipo de automação, o lead envolvido, o timestamp de execução, e se foi executada com sucesso ou falhou.
5. IF uma Automação falhar durante sua execução, THEN THE Sistema SHALL registrar o erro no log de auditoria e não afetar o funcionamento das demais automações.

---

### Requirement 11: Redesign da Interface (UI Premium)

**User Story:** Como corretor de imóveis, quero uma interface visual moderna e profissional, para que eu tenha prazer em usar o sistema e cause boa impressão ao mostrar para clientes e parceiros.

#### Critérios de Aceitação

1. THE Sistema SHALL oferecer modo escuro e modo claro, com alternância disponível em qualquer tela da aplicação.
2. WHEN o corretor alterna entre modo escuro e modo claro, THE Sistema SHALL persistir a preferência no armazenamento local do navegador e aplicar o tema imediatamente sem recarregar a página.
3. THE Sistema SHALL ser responsivo, adaptando o layout para telas móveis (largura < 768px) e desktop (largura ≥ 768px), com navegação acessível em ambas as resoluções.
4. THE Sistema SHALL utilizar a paleta de cores, tipografia e componentes visuais de forma consistente em todas as telas, seguindo um design system baseado em Tailwind CSS.
5. THE Sistema SHALL exibir animações de transição suaves entre telas e elementos interativos, utilizando Framer Motion para preservar consistência com o código existente.
6. THE Dashboard SHALL ser a tela inicial exibida ao acessar a aplicação, com métricas visíveis acima da dobra sem necessidade de scroll.

---

### Requirement 12: Assistente de IA para Vendas Imobiliárias

**User Story:** Como corretor de imóveis, quero um assistente de IA integrado ao CRM, para que eu possa gerar mensagens, resumos e conteúdo de marketing de alta qualidade sem sair do sistema.

#### Critérios de Aceitação

1. WHEN o corretor acessa a Ficha_Cliente de um lead com histórico de conversas, THE Assistente_IA SHALL permitir gerar um resumo da conversa em até 200 palavras, capturando os pontos principais discutidos, interesse do lead e próximos passos sugeridos.
2. WHEN o corretor solicita ao Assistente_IA a geração de uma mensagem WhatsApp personalizada para um lead, THE Assistente_IA SHALL gerar uma mensagem levando em conta o nome do lead, seu perfil de interesse imobiliário e o contexto da última conversa.
3. THE Assistente_IA SHALL oferecer os seguintes templates de geração de conteúdo acessíveis no painel de IA: (a) Follow-up após visita, (b) Mensagem de reativação de lead frio, (c) Anúncio para Instagram/Facebook, (d) Legenda para redes sociais, (e) Script de vendas para ligação telefônica.
4. WHEN o corretor seleciona um template e fornece informações sobre o empreendimento ou lead, THE Assistente_IA SHALL gerar o conteúdo solicitado utilizando o modelo GPT-4o-mini via API da OpenAI.
5. WHEN o Assistente_IA gera uma mensagem ou conteúdo, THE Sistema SHALL permitir que o corretor copie o texto gerado para a área de transferência com um único clique.
6. WHEN o corretor está visualizando uma conversa WhatsApp, THE Assistente_IA SHALL oferecer a opção de gerar uma resposta automática sugerida com base no conteúdo da última mensagem recebida do lead.
7. IF a API da OpenAI retornar um erro, THEN THE Assistente_IA SHALL exibir uma mensagem de erro descritiva ao corretor e sugerir que ele tente novamente em instantes.

---

### Requirement 13: Gestão de Configurações e Segurança

**User Story:** Como corretor de imóveis, quero gerenciar as configurações do sistema em um painel dedicado, para que eu possa personalizar o comportamento do CRM sem precisar editar arquivos de código.

#### Critérios de Aceitação

1. THE Sistema SHALL disponibilizar uma tela de Configurações com as seguintes seções: Configurações WhatsApp (token de verificação, número de telefone da conta Business), Horário Comercial (dias e horários), Mensagens Automáticas (texto de boas-vindas e mensagem de ausência), e Automações (período de follow-up automático).
2. WHEN o corretor salva as configurações, THE Sistema SHALL persistir as configurações no banco de dados e aplicá-las imediatamente sem necessidade de reiniciar o servidor.
3. THE Sistema SHALL validar os campos obrigatórios das configurações antes de salvar, exibindo mensagens de erro específicas para campos inválidos ou ausentes.
4. IF o token de verificação do WhatsApp não estiver configurado, THEN THE Sistema SHALL exibir um aviso na tela de Configurações indicando que a integração WhatsApp está inativa.
