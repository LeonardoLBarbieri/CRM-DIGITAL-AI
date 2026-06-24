# Documento de Requisitos

## Introdução

O **lb-crm-whatsapp** é uma expansão do sistema `leonardo-digital-ai` existente, transformando-o num CRM imobiliário completo integrado ao WhatsApp Business API. O sistema gerencia todo o ciclo de vida de leads imobiliários — desde a recepção automática via WhatsApp até o fechamento da venda — com automações inteligentes, kanban completo com 12 etapas, ficha detalhada de clientes, disparos em massa, dashboard gerencial e assistente de IA integrado. A aplicação é construída em Next.js 15, TypeScript, Prisma + SQLite e Tailwind CSS.

---

## Glossário

- **CRM**: Customer Relationship Management — sistema de gestão de relacionamento com clientes
- **Lead**: Potencial cliente que demonstrou interesse em imóveis
- **Kanban**: Quadro visual com colunas representando etapas do funil de vendas
- **Temperatura**: Classificação de urgência/potencial de um lead (Frio, Morno, Quente, Prioritário)
- **Funil**: Sequência de etapas que um lead percorre até se tornar venda
- **WhatsApp_Gateway**: Componente responsável por se comunicar com a WhatsApp Business API
- **CRM_System**: Sistema principal de gestão de leads e conversas
- **Kanban_Board**: Componente visual de arrastar e soltar para gestão do funil
- **Lead_Profile**: Ficha completa de dados de um lead
- **Task_Manager**: Componente de criação e gestão de tarefas por lead
- **Dashboard**: Painel gerencial com métricas e gráficos
- **Blast_Engine**: Motor de disparos de mensagens em massa via WhatsApp
- **Automation_Engine**: Motor de automações baseadas em eventos e tempo
- **AI_Assistant**: Assistente de inteligência artificial integrado ao CRM
- **Message**: Mensagem trocada entre corretor e lead via WhatsApp
- **Broker**: Corretor de imóveis, usuário principal do sistema
- **Webhook**: Endpoint HTTP que recebe notificações em tempo real da WhatsApp Business API
- **Business_Hours**: Horário comercial configurável para envio automático de mensagens fora do expediente

---

## Requisitos

### Requisito 1: Integração com WhatsApp Business API — Recepção de Leads

**User Story:** Como corretor, quero receber leads automaticamente pelo WhatsApp, para que nenhum contato seja perdido e todo novo lead seja cadastrado sem esforço manual.

#### Critérios de Aceitação

1. WHEN o WhatsApp_Gateway recebe uma mensagem de um número não cadastrado no CRM_System, THE CRM_System SHALL criar automaticamente um novo lead com nome derivado do perfil do WhatsApp (ou número como fallback), telefone, data/hora de criação e status "Lead Novo"
2. WHEN um novo lead é criado via webhook, THE CRM_System SHALL registrar a mensagem recebida no histórico de conversas associado ao lead
3. WHEN um novo lead é criado via webhook, THE CRM_System SHALL enviar automaticamente uma mensagem de apresentação configurável para o número do lead via WhatsApp_Gateway
4. IF o webhook receber uma mensagem de um número já cadastrado, THEN THE CRM_System SHALL registrar a mensagem no histórico de conversas existente do lead sem criar duplicata
5. WHEN a WhatsApp Business API enviar uma notificação de entrega ou leitura, THE WhatsApp_Gateway SHALL atualizar o status da mensagem correspondente no CRM_System
6. THE WhatsApp_Gateway SHALL expor um endpoint de webhook em `/api/whatsapp/webhook` que valida o token de verificação do Meta e processa eventos de mensagens recebidas
7. IF o webhook receber uma requisição de verificação (challenge) do Meta, THEN THE WhatsApp_Gateway SHALL responder com o `hub.challenge` correto para confirmar o endpoint

---

### Requisito 2: Integração com WhatsApp Business API — Envio de Mensagens

**User Story:** Como corretor, quero responder leads diretamente pelo CRM sem abrir o WhatsApp, para que toda comunicação fique centralizada e registrada.

#### Critérios de Aceitação

1. WHEN o Broker envia uma mensagem pelo CRM_System para um lead, THE WhatsApp_Gateway SHALL entregar a mensagem ao número do lead via WhatsApp Business API dentro de 5 segundos
2. WHEN o WhatsApp_Gateway entrega uma mensagem com sucesso, THE CRM_System SHALL registrar a mensagem no histórico com status "enviada", remetente "broker" e timestamp
3. IF a WhatsApp Business API retornar erro ao enviar mensagem, THEN THE CRM_System SHALL exibir notificação de falha ao Broker e registrar o erro no histórico da conversa
4. WHILE o horário atual estiver fora do Business_Hours configurado, THE CRM_System SHALL enviar automaticamente uma mensagem de ausência configurável ao lead que iniciou contato
5. THE CRM_System SHALL permitir que o Broker configure o Business_Hours com dias da semana (seg–dom) e faixas de horário de início e fim por dia
6. WHEN o Broker visualiza a conversa de um lead, THE CRM_System SHALL exibir todas as mensagens em ordem cronológica com indicação clara de remetente (lead ou broker) e timestamp

---

### Requisito 3: CRM Kanban Completo com Drag and Drop

**User Story:** Como corretor, quero gerenciar meus leads num quadro kanban com 12 etapas e arrastar os cards entre colunas, para que eu tenha visibilidade total do funil de vendas.

#### Critérios de Aceitação

1. THE Kanban_Board SHALL exibir exatamente 12 colunas na seguinte ordem: Lead Novo, Primeiro Contato, Qualificação, Em Negociação, Visita Agendada, Visita Realizada, Proposta Enviada, Aguardando Resposta, Reserva Efetuada, Contrato Assinado, Venda Concluída, Lead Perdido
2. WHEN o Broker arrasta um card de lead para outra coluna, THE Kanban_Board SHALL atualizar o status do lead no CRM_System imediatamente e sem recarregar a página
3. WHEN o status de um lead é alterado (por drag and drop ou programaticamente), THE CRM_System SHALL registrar no histórico de movimentação o status anterior, o novo status e o timestamp da mudança
4. THE Kanban_Board SHALL exibir em cada card: nome do lead, temperatura (com cor correspondente), número de mensagens não lidas e próxima tarefa pendente
5. WHEN o Broker clica em um card do kanban, THE CRM_System SHALL abrir a Lead_Profile completa do lead em painel lateral ou modal sem navegar para outra página
6. THE Kanban_Board SHALL ser responsivo, permitindo scroll horizontal em telas menores que 1280px

---

### Requisito 4: Ficha Completa do Lead (Lead_Profile)

**User Story:** Como corretor, quero registrar dados detalhados de cada lead — pessoais, financeiros e de interesse imobiliário — para que eu possa personalizar o atendimento e qualificar melhor cada oportunidade.

#### Critérios de Aceitação

1. THE Lead_Profile SHALL armazenar dados pessoais: nome completo, telefone, WhatsApp, e-mail, cidade e bairro
2. THE Lead_Profile SHALL armazenar perfil financeiro: faixa de renda mensal (seleção por faixa), disponibilidade de FGTS (booleano), valor de entrada disponível, se financiamento foi aprovado (booleano)
3. THE Lead_Profile SHALL armazenar interesse imobiliário: tipo de imóvel (apartamento, casa, cobertura, comercial), área privativa desejada em m², faixa de preço (mínimo e máximo), região de interesse, número de quartos, número de vagas de garagem e empreendimento(s) de interesse
4. WHEN o Broker salva alterações na Lead_Profile, THE CRM_System SHALL persistir todos os campos alterados no banco de dados e exibir confirmação visual dentro de 2 segundos
5. THE Lead_Profile SHALL exibir o histórico completo de conversas do WhatsApp do lead na mesma tela
6. THE Lead_Profile SHALL exibir todas as tarefas associadas ao lead com status (pendente, concluída, atrasada)
7. THE Lead_Profile SHALL exibir o histórico de movimentação do lead pelo funil com timestamps
8. IF o Broker tentar salvar Lead_Profile sem nome completo ou sem telefone/WhatsApp, THEN THE CRM_System SHALL bloquear o salvamento e exibir mensagem de erro indicando os campos obrigatórios

---

### Requisito 5: Classificação de Temperatura de Leads

**User Story:** Como corretor, quero classificar leads por temperatura (Frio, Morno, Quente, Prioritário), para que eu possa priorizar meu atendimento e identificar rapidamente as melhores oportunidades.

#### Critérios de Aceitação

1. THE CRM_System SHALL suportar exatamente 4 classificações de temperatura: Frio (cor azul), Morno (cor amarela), Quente (cor laranja), Prioritário (cor vermelha)
2. WHEN o Broker altera a temperatura de um lead, THE CRM_System SHALL atualizar a cor do indicador no card do Kanban_Board e na Lead_Profile imediatamente
3. THE Kanban_Board SHALL permitir filtragem de cards por temperatura, exibindo apenas leads da(s) temperatura(s) selecionada(s)
4. WHEN um novo lead é criado automaticamente via webhook do WhatsApp_Gateway, THE CRM_System SHALL atribuir temperatura "Frio" como padrão
5. THE CRM_System SHALL exibir legenda das temperaturas com descrição de cada nível em local visível do Kanban_Board

---

### Requisito 6: Sistema de Tarefas e Lembretes (Task_Manager)

**User Story:** Como corretor, quero criar tarefas vinculadas a leads com prazo e alertas, para que eu nunca esqueça um retorno, visita ou envio de proposta.

#### Critérios de Aceitação

1. WHEN o Broker cria uma tarefa para um lead, THE Task_Manager SHALL persistir: tipo de tarefa (ligar, enviar proposta, confirmar visita, enviar contrato, outro), descrição livre, data/hora de vencimento e lead associado
2. THE Dashboard SHALL exibir na tela inicial três seções de tarefas: "Atrasadas" (vencimento antes de agora), "Hoje" (vencimento hoje) e "Próximos Compromissos" (vencimento nos próximos 7 dias)
3. WHILE existirem tarefas atrasadas, THE CRM_System SHALL exibir um indicador visual de alerta (badge com contagem) no menu de navegação
4. WHEN o Broker marca uma tarefa como concluída, THE Task_Manager SHALL atualizar o status para "concluída" e remover a tarefa das seções de alerta
5. WHEN a Automation_Engine cria um novo lead via webhook, THE Task_Manager SHALL criar automaticamente uma tarefa do tipo "ligar" com vencimento em 30 minutos para o lead recém-criado
6. THE Task_Manager SHALL permitir edição e exclusão de tarefas pendentes pelo Broker

---

### Requisito 7: Dashboard Gerencial

**User Story:** Como corretor, quero um dashboard com métricas e gráficos do meu funil de vendas, para que eu possa tomar decisões baseadas em dados e acompanhar minha performance.

#### Critérios de Aceitação

1. THE Dashboard SHALL exibir as seguintes métricas numéricas: total de leads ativos, leads recebidos hoje, leads recebidos nesta semana, leads recebidos neste mês, visitas agendadas pendentes, propostas em aberto, vendas concluídas no mês
2. THE Dashboard SHALL calcular e exibir a taxa de conversão geral (leads com status "Venda Concluída" dividido pelo total de leads, em percentual)
3. THE Dashboard SHALL exibir um gráfico de barras com a distribuição de leads por etapa do funil (todas as 12 colunas)
4. THE Dashboard SHALL exibir um gráfico de linha com a evolução de novos leads por dia nos últimos 30 dias
5. THE Dashboard SHALL exibir receita estimada (soma dos orçamentos dos leads em etapas "Proposta Enviada" a "Venda Concluída") e receita realizada (soma dos orçamentos de leads "Venda Concluída")
6. WHEN o Broker aplica filtro de período no Dashboard (último mês, últimos 3 meses, este ano), THE Dashboard SHALL recalcular todas as métricas e gráficos para o período selecionado sem recarregar a página

---

### Requisito 8: Disparos Automáticos de WhatsApp (Blast_Engine)

**User Story:** Como corretor, quero importar contatos e fazer disparos em massa de mensagens pelo WhatsApp, para que eu possa nutrir minha base de leads com comunicação segmentada e personalizada.

#### Critérios de Aceitação

1. THE Blast_Engine SHALL aceitar importação de contatos via arquivo CSV ou XLSX com colunas mapeáveis para os campos da Lead_Profile
2. WHEN o Broker importa um arquivo válido, THE Blast_Engine SHALL exibir preview dos contatos a serem importados com mapeamento de colunas antes de confirmar a importação
3. THE Blast_Engine SHALL permitir criação de mensagens de disparo com variáveis dinâmicas: `{nome}`, `{empreendimento}`, `{cidade}`, `{corretor}`
4. THE Blast_Engine SHALL permitir segmentação de destinatários por: temperatura do lead, empreendimento de interesse, faixa de preço, tipo de imóvel e cidade
5. WHEN o Broker programa um disparo, THE Blast_Engine SHALL permitir agendar data e hora de início do envio
6. WHEN o Blast_Engine executa um disparo em massa, THE Blast_Engine SHALL enviar as mensagens com intervalo mínimo de 3 segundos entre cada envio para evitar bloqueio pela API do WhatsApp
7. THE Blast_Engine SHALL exibir relatório de disparo com: total de destinatários, mensagens enviadas com sucesso, falhas de envio e status de cada mensagem
8. IF o arquivo de importação contiver linhas com telefone inválido ou duplicado, THEN THE Blast_Engine SHALL ignorar essas linhas, exibir contagem de linhas ignoradas e prosseguir com as válidas

---

### Requisito 9: Automações Inteligentes (Automation_Engine)

**User Story:** Como corretor, quero automações que atuem em eventos e decorrência de tempo, para que o sistema trabalhe por mim nos follow-ups e primeiros contatos, aumentando minha taxa de resposta.

#### Critérios de Aceitação

1. WHEN a Automation_Engine detecta que um lead ficou sem resposta do Broker por mais de X dias (configurável, padrão 3 dias), THE Automation_Engine SHALL disparar automaticamente uma mensagem de follow-up configurável para o lead via WhatsApp_Gateway
2. THE CRM_System SHALL permitir que o Broker configure o texto da mensagem de follow-up e o número de dias de inatividade que dispara o follow-up
3. WHEN a Automation_Engine executa um follow-up automático, THE CRM_System SHALL registrar a ação no histórico do lead com indicação de que foi uma ação automática
4. THE Automation_Engine SHALL verificar leads inativos a cada hora para identificar quais leads precisam de follow-up
5. IF um lead já estiver nas etapas "Venda Concluída" ou "Lead Perdido", THEN THE Automation_Engine SHALL excluir esse lead da verificação de follow-up automático
6. THE CRM_System SHALL permitir ativar ou desativar individualmente cada automação (mensagem de boas-vindas, mensagem fora do horário, tarefa automática de retorno, follow-up automático)

---

### Requisito 10: Redesign da Interface (UI Premium)

**User Story:** Como corretor, quero uma interface visual premium, responsiva e com modo escuro/claro, para que o sistema seja agradável de usar diariamente e transmita profissionalismo.

#### Critérios de Aceitação

1. THE CRM_System SHALL implementar tema escuro e tema claro com alternância persistida na preferência do usuário (localStorage)
2. THE CRM_System SHALL ser totalmente funcional em telas com largura mínima de 375px (mobile) e máxima de 2560px (desktop wide)
3. THE CRM_System SHALL utilizar uma paleta de cores consistente, tipografia moderna (Inter ou similar) e espaçamentos padronizados em todos os componentes
4. THE CRM_System SHALL utilizar animações sutis de transição (Framer Motion) em abertura de modais, drag and drop e mudanças de estado, com duração máxima de 300ms
5. THE CRM_System SHALL ter uma barra de navegação lateral (sidebar) com acesso a: Dashboard, Kanban, Leads, Conversas, Tarefas, Disparos, Automações, Configurações
6. WHEN a sidebar é exibida em mobile, THE CRM_System SHALL colapsá-la como menu hamburguer overlay sem empurrar o conteúdo principal

---

### Requisito 11: Assistente de IA Integrado (AI_Assistant)

**User Story:** Como corretor, quero um assistente de IA que me ajude a gerar mensagens, resumir conversas e criar conteúdo, para que eu produza comunicações de alta qualidade em menos tempo.

#### Critérios de Aceitação

1. WHEN o Broker solicita resumo de uma conversa, THE AI_Assistant SHALL usar a OpenAI API para gerar um resumo em até 3 parágrafos dos pontos mais relevantes da conversa do lead, incluindo interesses e objeções identificadas
2. WHEN o Broker solicita geração de mensagem de WhatsApp, THE AI_Assistant SHALL receber o contexto do lead (nome, interesse, etapa do funil) e gerar uma mensagem personalizada pronta para envio
3. THE AI_Assistant SHALL oferecer geração de: mensagem de follow-up, mensagem de apresentação de empreendimento, script de abordagem de vendas, anúncio imobiliário para redes sociais e legenda para post de imóvel
4. WHEN o AI_Assistant gera qualquer conteúdo, THE CRM_System SHALL exibir o resultado em campo editável antes de o Broker enviar ou copiar, permitindo ajustes
5. IF a OpenAI API retornar erro ou timeout, THEN THE AI_Assistant SHALL exibir mensagem de erro amigável e oferecer opção de tentar novamente sem perder o contexto da solicitação
6. THE AI_Assistant SHALL estar acessível a partir da Lead_Profile de qualquer lead e do módulo de Disparos para geração de mensagens de campanha

---

### Requisito 12: Gestão de Configurações do Sistema

**User Story:** Como corretor, quero configurar todos os parâmetros do sistema — API keys, horário comercial, mensagens automáticas — em um único painel, para que eu possa personalizar o CRM sem precisar editar código.

#### Critérios de Aceitação

1. THE CRM_System SHALL ter uma tela de Configurações com seções: Integração WhatsApp (token de acesso, número de telefone, token de verificação do webhook), Horário Comercial, Mensagens Automáticas e Automações
2. WHEN o Broker salva as configurações de integração WhatsApp, THE CRM_System SHALL persistir os valores em variáveis de ambiente ou banco de dados e usá-los em todas as chamadas ao WhatsApp_Gateway
3. THE CRM_System SHALL permitir configurar individualmente para cada dia da semana: se é dia útil, horário de início e horário de fim do Business_Hours
4. THE CRM_System SHALL permitir configurar o texto da mensagem de boas-vindas para novos leads, a mensagem de ausência fora do Business_Hours e a mensagem de follow-up automático, todas com suporte a variáveis dinâmicas (`{nome}`, `{corretor}`)
5. WHEN o Broker testa a integração WhatsApp nas Configurações, THE CRM_System SHALL enviar uma mensagem de teste para o próprio número configurado e exibir o resultado (sucesso ou erro) em até 10 segundos
