# Implementation Plan: lb-crm-whatsapp

## Overview

Transformar o `leonardo-digital-ai` num CRM imobiliário completo com integração ao WhatsApp Business API.
A implementação segue o stack existente (Next.js 16, TypeScript, Prisma 5 + SQLite, Tailwind CSS v4, Framer Motion v12, OpenAI SDK v6) e adiciona `@hello-pangea/dnd`, `xlsx`, `next-themes`, `date-fns`, `vitest` e `fast-check`.

## Tasks

- [x] 1. Preparar dependências, schema Prisma e tipos globais
  - [x] 1.1 Instalar dependências novas: `@hello-pangea/dnd`, `xlsx`, `next-themes`, `date-fns`
    - Executar `npm install @hello-pangea/dnd xlsx next-themes date-fns`
    - Executar `npm install -D vitest @vitest/coverage-v8 fast-check`
    - Adicionar script `"test": "vitest --run"` em `package.json`
    - _Requirements: 3.1 (dnd), 8.1 (xlsx), 10.1 (next-themes)_

  - [x] 1.2 Migrar schema Prisma para o modelo expandido
    - Substituir `prisma/schema.prisma` pelo schema completo do design (Lead expandido, WhatsAppMessage, LeadHistory, Task, Campaign, CampaignRecipient, SystemConfig)
    - Executar `npx prisma migrate dev --name crm-whatsapp-init`
    - Regenerar cliente com `npx prisma generate`
    - _Requirements: 1.1, 2.2, 3.3, 4.1–4.3, 6.1, 7.5, 8.1, 9.1, 12.2_

  - [x] 1.3 Criar arquivo de tipos globais `src/lib/types.ts`
    - Definir `Temperature`, `LeadStatus`, `TaskType`, `MessageStatus`, `TemplateVars`, `WebhookEntry`, `DashboardMetrics`
    - _Requirements: 3.1, 4.1–4.3, 5.1, 6.1, 7.1_


- [x] 2. Biblioteca de utilitários de negócio (`src/lib/`)
  - [x] 2.1 Implementar `src/lib/utils.ts` — adicionar `renderTemplate(tpl, vars)`
    - Substituir cada placeholder `{nome}`, `{empreendimento}`, `{cidade}`, `{corretor}` pelo valor correspondente de `TemplateVars`
    - Preservar placeholders sem valor correspondente como string vazia
    - _Requirements: 8.3, 9.1, 12.4_

  - [ ]* 2.2 Escrever property test para `renderTemplate` (Property 18)
    - **Property 18: Variáveis dinâmicas de template são sempre substituídas**
    - **Validates: Requirements 8.3**
    - Criar `src/lib/__tests__/utils.test.ts`
    - _Requirements: 8.3_

  - [x] 2.3 Implementar `src/lib/whatsapp.ts`
    - `sendWhatsAppMessage(phone, body)` — chama Meta Graph API v18 com token de `SystemConfig`
    - `isWithinBusinessHours(timestamp, config)` — verifica se timestamp cai dentro do horário configurado
    - Tratar erros: token não configurado → HTTP 503; API error → lança com detalhes
    - _Requirements: 2.1, 2.4, 2.5, 12.2_

  - [ ]* 2.4 Escrever property test para `isWithinBusinessHours` (Property 6)
    - **Property 6: Mensagem de ausência disparada fora do horário comercial**
    - **Validates: Requirements 2.4**
    - _Requirements: 2.4_

  - [x] 2.5 Implementar `src/lib/automation.ts` — `checkAndSendFollowUps()`
    - Buscar leads inativos (`lastMessageAt < now - followUpDays`) excluindo "Venda Concluída" e "Lead Perdido"
    - Enviar mensagem de follow-up via `sendWhatsAppMessage`, registrar `WhatsAppMessage` com `isAutomated=true, sender="system"`
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [ ]* 2.6 Escrever property test para `checkAndSendFollowUps` (Property 21 e 22)
    - **Property 21: Follow-up identifica corretamente leads inativos**
    - **Property 22: Follow-up registrado como ação do sistema**
    - **Validates: Requirements 9.1, 9.3, 9.5**
    - _Requirements: 9.1, 9.3, 9.5_

  - [x] 2.7 Implementar `src/lib/campaign.ts`
    - `importContacts(buffer, mimeType)` — parseia CSV/XLSX via `xlsx`, valida telefones, deduplica, retorna `{ valid[], skipped: number }`
    - `executeCampaign(campaignId)` — itera destinatários com intervalo mínimo de 3s, atualiza status de cada `CampaignRecipient`
    - _Requirements: 8.1, 8.2, 8.6, 8.7, 8.8_

  - [ ]* 2.8 Escrever property test para `importContacts` (Property 20)
    - **Property 20: Importação ignora linhas inválidas e contagem é exata**
    - **Validates: Requirements 8.8**
    - _Requirements: 8.8_


- [x] 3. API Routes — WhatsApp Gateway
  - [x] 3.1 Criar `src/app/api/whatsapp/webhook/route.ts`
    - `GET`: validar `hub.verify_token` contra `SystemConfig`; responder com `hub.challenge` ou 403
    - `POST`: parsear `WebhookEntry`; criar lead se número desconhecido (`status=Lead Novo, temperature=Frio`); registrar `WhatsAppMessage`; enviar boas-vindas se `automation.enableWelcome=true`; responder 200 sempre
    - Atualizar status de `WhatsAppMessage` ao receber eventos `delivered`/`read`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 5.4_

  - [ ]* 3.2 Escrever property tests para o webhook (Properties 1, 2, 3)
    - **Property 1: Criação de lead via webhook preserva dados e define padrões corretos**
    - **Property 2: Idempotência de recepção — número já cadastrado não gera duplicata**
    - **Property 3: Atualização de status de mensagem via webhook de entrega**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5, 5.4**
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 3.3 Criar `src/app/api/whatsapp/send/route.ts`
    - `POST { leadId, message }`: buscar lead, chamar `sendWhatsAppMessage`, persistir `WhatsAppMessage` com `sender="broker", status="enviada"`
    - Em caso de erro da Meta API: salvar com `status="erro"`, retornar `{ error, details }`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.4 Escrever property test para envio de mensagem (Property 4)
    - **Property 4: Mensagem enviada é sempre registrada com campos corretos**
    - **Validates: Requirements 2.2**
    - _Requirements: 2.2_


- [ ] 4. API Routes — Leads e Histórico
  - [x] 4.1 Criar `src/app/api/leads/route.ts`
    - `GET ?status=&temperature=&page=`: listar leads com filtros e paginação
    - `POST`: criar lead, validar `name` obrigatório e pelo menos `phone` ou `whatsapp`; retornar 400 se inválido
    - `PUT`: atualizar lead; registrar `LeadHistory` se `status` mudou
    - `DELETE ?id=`: excluir lead
    - _Requirements: 4.1–4.4, 4.8, 5.3, 10.5_

  - [ ] 4.2 Criar `src/app/api/leads/[id]/route.ts`
    - `GET`: retornar lead com `messages` ordenadas por `timestamp` ASC, `tasks`, `history`
    - _Requirements: 2.6, 4.5, 4.6, 4.7_

  - [ ]* 4.3 Escrever property tests para leads (Properties 5, 7, 9, 10, 11, 12)
    - **Property 5: Mensagens retornadas em ordem cronológica**
    - **Property 7: Atualização de status registra histórico de movimentação**
    - **Property 9: Round-trip completo da ficha do lead**
    - **Property 10: Validação bloqueia salvamento sem campos obrigatórios**
    - **Property 11: Atualização de temperatura persiste corretamente**
    - **Property 12: Filtragem por temperatura retorna apenas leads correspondentes**
    - **Validates: Requirements 2.6, 3.3, 4.1–4.4, 4.8, 5.2, 5.3**
    - _Requirements: 2.6, 3.3, 4.1–4.8, 5.2, 5.3_


- [ ] 5. API Routes — Tarefas, Dashboard, IA, Config e Automação
  - [x] 5.1 Criar `src/app/api/tasks/route.ts`
    - `GET ?leadId=&status=`: listar tarefas com filtros; classificar cada tarefa em `overdue/today/upcoming` pelo campo `dueAt`
    - `POST`: criar tarefa; validar `leadId`, `type`, `dueAt`
    - `PUT`: atualizar status, descrição, `dueAt`
    - `DELETE ?id=`: excluir tarefa pendente
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [ ]* 5.2 Escrever property tests para tarefas (Properties 13, 14, 15)
    - **Property 13: Round-trip de criação de tarefa**
    - **Property 14: Classificação temporal de tarefas é sempre correta**
    - **Property 15: Tarefa automática criada ao receber novo lead via webhook**
    - **Validates: Requirements 6.1, 6.2, 6.5**
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 5.3 Criar `src/app/api/dashboard/route.ts`
    - `GET ?period=month|3months|year`: calcular `DashboardMetrics` — total de leads, leads por período, taxa de conversão, receita estimada/realizada, distribuição do funil, novos leads por dia (30d)
    - _Requirements: 7.1–7.6_

  - [ ]* 5.4 Escrever property tests para o dashboard (Properties 16, 17)
    - **Property 16: Métricas do dashboard são consistentes com dados do banco**
    - **Property 17: Filtro de período restringe todas as métricas ao intervalo informado**
    - **Validates: Requirements 7.1, 7.2, 7.6**
    - _Requirements: 7.1, 7.2, 7.6_

  - [-] 5.5 Criar `src/app/api/campaigns/route.ts`
    - `GET`: listar campanhas com `recipients` aggregados
    - `POST`: criar campanha; aceitar upload de arquivo (CSV/XLSX) via `FormData`, chamar `importContacts`, pré-visualizar destinatários
    - Ao iniciar campanha: invocar `executeCampaign(id)` com throttle de 3s
    - _Requirements: 8.1–8.8_

  - [-] 5.6 Criar `src/app/api/ai/assist/route.ts`
    - `POST { type, leadId?, context? }`: gerar conteúdo via OpenAI SDK (`gpt-4o-mini`)
    - Tipos suportados: `summarize_conversation`, `generate_message`, `followup_message`, `presentation_message`, `sales_script`, `social_ad`, `property_caption`
    - Tratar rate limit (429), timeout e chave não configurada (503)
    - _Requirements: 11.1–11.5_

  - [-] 5.7 Criar `src/app/api/config/route.ts`
    - `GET`: retornar todos os pares `SystemConfig` como `Record<string, string>`
    - `PUT`: fazer upsert em lote de pares chave-valor
    - _Requirements: 12.1–12.4_

  - [ ]* 5.8 Escrever property test para configurações (Property 23)
    - **Property 23: Round-trip de configurações do sistema**
    - **Validates: Requirements 12.2, 12.4**
    - _Requirements: 12.2, 12.4_

  - [-] 5.9 Criar `src/app/api/automation/check/route.ts`
    - `POST`: chamar `checkAndSendFollowUps()` e retornar `{ processed: number }`
    - _Requirements: 9.4_

- [ ] 6. Checkpoint — APIs funcionais
  - Garantir que todos os testes passam. Testar manualmente os endpoints com o banco SQLite local. Perguntar ao usuário se há dúvidas antes de continuar.


- [ ] 7. Layout principal, ThemeProvider e Sidebar
  - [ ] 7.1 Atualizar `src/app/layout.tsx` com `ThemeProvider` do `next-themes`
    - Envolver `children` com `<ThemeProvider attribute="class" defaultTheme="dark" storageKey="crm-theme">`
    - _Requirements: 10.1_

  - [ ] 7.2 Atualizar `src/app/globals.css` com CSS variables para tema claro/escuro
    - Definir paleta completa: backgrounds, foregrounds, accent, borders, shadows
    - Aplicar tipografia Inter via `@import`
    - Garantir responsividade mínima de 375px
    - _Requirements: 10.2, 10.3_

  - [ ] 7.3 Criar `src/components/layout/Sidebar.tsx`
    - Links para: Dashboard `/`, Kanban `/crm`, Leads `/leads`, Conversas `/conversas`, Tarefas `/tarefas`, Disparos `/disparos`, Automações `/automacoes`, Configurações `/configuracoes`
    - Badge de alerta com contagem de tarefas atrasadas no link Tarefas
    - Em mobile (<768px): colapsável como menu hamburguer overlay (não empurra conteúdo)
    - Animação de abertura com Framer Motion `<= 300ms`
    - _Requirements: 6.3, 10.5, 10.6_

  - [ ] 7.4 Criar `src/components/layout/ThemeToggle.tsx`
    - Botão que alterna entre tema claro/escuro via `useTheme` do `next-themes`
    - _Requirements: 10.1_


- [ ] 8. Dashboard — página inicial `/`
  - [ ] 8.1 Criar `src/components/dashboard/MetricCard.tsx`
    - Card com label, valor numérico e variação percentual opcional
    - Animação de entrada com Framer Motion `<= 300ms`
    - _Requirements: 7.1, 10.4_

  - [ ] 8.2 Criar `src/app/page.tsx` (Dashboard)
    - Consumir `GET /api/dashboard?period=...` e renderizar:
      - Cards de métricas (total leads, hoje, semana, mês, visitas, propostas, vendas, tx. conversão)
      - Gráfico de barras (Recharts) com distribuição por etapa do funil
      - Gráfico de linha (Recharts) com novos leads por dia (30d)
      - Receita estimada e realizada
      - Seções de tarefas: Atrasadas, Hoje, Próximos Compromissos
      - Filtro de período (último mês / 3 meses / este ano) sem reload
    - _Requirements: 7.1–7.6, 6.2_


- [ ] 9. Kanban Board — `/crm`
  - [ ] 9.1 Criar `src/components/crm/TemperatureBadge.tsx` (também usado em leads)
    - Mapear: Frio→azul, Morno→amarelo, Quente→laranja, Prioritário→vermelho
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 9.2 Criar `src/components/crm/LeadCard.tsx`
    - Exibir: nome, badge de temperatura, contador de mensagens não lidas, próxima tarefa pendente
    - Componente draggable do `@hello-pangea/dnd`
    - _Requirements: 3.4, 3.5_

  - [ ] 9.3 Criar `src/components/crm/KanbanColumn.tsx`
    - Droppable do `@hello-pangea/dnd`, título da coluna, lista de `LeadCard`
    - _Requirements: 3.1, 3.2_

  - [ ] 9.4 Criar `src/components/crm/KanbanBoard.tsx`
    - `DragDropContext` com `onDragEnd` chamando `PUT /api/leads` para atualizar `status` e registrar `LeadHistory`
    - Atualizar estado local imediatamente (otimistic update) sem reload
    - Filtro de temperatura: chips de seleção múltipla filtrando cards exibidos
    - Scroll horizontal em telas < 1280px
    - Legenda de temperaturas visível
    - Animação de drop com Framer Motion `<= 300ms`
    - _Requirements: 3.1–3.6, 5.3, 5.5_

  - [ ] 9.5 Criar `src/app/crm/page.tsx`
    - Consumir `GET /api/leads` e renderizar `KanbanBoard`
    - _Requirements: 3.1–3.6_


- [ ] 10. Ficha do lead — `/leads/[id]`
  - [ ] 10.1 Criar `src/components/leads/LeadForm.tsx`
    - Formulário editável com todos os campos da ficha: dados pessoais, perfil financeiro e interesse imobiliário
    - Validação: bloquear submit se `name` vazio ou `phone`/`whatsapp` ambos vazios, exibindo erro inline
    - Exibir confirmação visual em até 2s após salvar
    - _Requirements: 4.1–4.4, 4.8_

  - [ ] 10.2 Criar `src/components/conversations/MessageBubble.tsx`
    - Bolha de mensagem com distinção visual de remetente (lead vs broker vs system)
    - Exibir timestamp formatado
    - _Requirements: 2.6_

  - [ ] 10.3 Criar `src/components/conversations/ConversationPanel.tsx`
    - Lista de mensagens em ordem cronológica com scroll infinito
    - Input de nova mensagem + botão enviar chamando `POST /api/whatsapp/send`
    - Botão "Resumir conversa" disparando `POST /api/ai/assist { type: "summarize_conversation", leadId }`
    - _Requirements: 2.6, 11.1_

  - [ ] 10.4 Criar `src/components/tasks/TaskCard.tsx`
    - Card com tipo, descrição, `dueAt` formatado, indicador de `overdue/today/upcoming` e botão de marcar como concluída
    - _Requirements: 6.1, 6.4_

  - [ ] 10.5 Criar `src/components/ai/AIAssistantPanel.tsx`
    - Painel colapsável acessível na ficha do lead
    - Tipos de geração: follow-up, apresentação de empreendimento, script de abordagem, anúncio para redes sociais, legenda de imóvel
    - Exibir resultado em `<textarea>` editável antes de copiar/enviar
    - Tratar erro da OpenAI com mensagem amigável e botão "Tentar novamente"
    - _Requirements: 11.2–11.5_

  - [ ] 10.6 Criar `src/app/leads/[id]/page.tsx` (Ficha completa)
    - Consumir `GET /api/leads/[id]` e montar layout com: `LeadForm`, `ConversationPanel`, lista de tarefas via `TaskCard`, histórico de movimentação com timestamps, `AIAssistantPanel`
    - _Requirements: 4.5–4.7, 11.6_

  - [ ] 10.7 Criar `src/components/leads/LeadDrawer.tsx`
    - Painel lateral deslizante (Framer Motion `<= 300ms`) que abre ao clicar em card do kanban
    - Renderiza `LeadForm` compacto + `ConversationPanel` inline
    - _Requirements: 3.5, 10.4_

  - [ ] 10.8 Criar `src/app/leads/page.tsx` (Lista de leads)
    - Tabela/grid com busca, filtros de temperatura e status
    - Cada linha abre `LeadDrawer`
    - _Requirements: 5.3_


- [ ] 11. Inbox de conversas — `/conversas`
  - [ ] 11.1 Criar `src/app/conversas/page.tsx`
    - Lista de leads com mensagens não lidas ordenados pelo mais recente
    - Selecionar lead abre `ConversationPanel` à direita (layout two-pane)
    - _Requirements: 2.6_

- [ ] 12. Gestão de tarefas — `/tarefas`
  - [ ] 12.1 Criar `src/app/tarefas/page.tsx`
    - Três seções: Atrasadas, Hoje, Próximos 7 dias
    - Consumir `GET /api/tasks` e classificar por `overdue/today/upcoming`
    - Botão de criar nova tarefa (modal com campos tipo, descrição, `dueAt`, lead)
    - Editar e excluir tarefas pendentes
    - _Requirements: 6.1–6.4, 6.6_

- [ ] 13. Disparos em massa — `/disparos`
  - [ ] 13.1 Criar `src/components/campaigns/CampaignEditor.tsx`
    - Área de texto com autocomplete de variáveis `{nome}`, `{empreendimento}`, `{cidade}`, `{corretor}`
    - Preview em tempo real da mensagem renderizada com dados de exemplo
    - Filtros de segmentação: temperatura, empreendimento, preço, tipo de imóvel, cidade
    - _Requirements: 8.3, 8.4_

  - [ ] 13.2 Criar `src/app/disparos/page.tsx`
    - Upload de CSV/XLSX com preview de contatos antes de confirmar importação
    - `CampaignEditor` para compor mensagem
    - Agendamento de data/hora de envio
    - Relatório de disparo: total, enviados, falhas, status individual
    - _Requirements: 8.1–8.8_

  - [ ] 13.3 Integrar `AIAssistantPanel` no módulo de disparos
    - Botão "Gerar com IA" abre o painel de geração de mensagem de campanha
    - _Requirements: 11.3, 11.6_

- [ ] 14. Automações — `/automacoes`
  - [ ] 14.1 Criar `src/app/automacoes/page.tsx`
    - Cards de toggle para cada automação: boas-vindas, fora do horário, tarefa automática de retorno, follow-up
    - Campos de texto para configurar mensagens de cada automação com variáveis dinâmicas
    - Campo numérico para configurar dias de inatividade do follow-up
    - Salvar via `PUT /api/config`
    - _Requirements: 9.2, 9.6, 12.1, 12.4_


- [ ] 15. Configurações do sistema — `/configuracoes`
  - [ ] 15.1 Criar `src/components/config/BusinessHoursConfig.tsx`
    - Grid 7 linhas (seg–dom) × 3 colunas (toggle ativo, hora início, hora fim)
    - Persistir como JSON por dia na tabela `SystemConfig`
    - _Requirements: 2.5, 12.3_

  - [ ] 15.2 Criar `src/app/configuracoes/page.tsx`
    - Seção Integração WhatsApp: campos token de acesso, Phone Number ID, token de verificação, nome do corretor
    - Botão "Testar integração" chama `POST /api/whatsapp/send` para o próprio número e exibe resultado em até 10s
    - Seção `BusinessHoursConfig`
    - Seção Mensagens Automáticas (boas-vindas, ausência, follow-up) com campos de texto e variáveis
    - Salvar tudo via `PUT /api/config`
    - _Requirements: 12.1–12.5_

- [ ] 16. Checkpoint final — integração completa
  - Garantir que todos os testes passam (`npm test`). Verificar que sidebar exibe todas as 8 seções, que o kanban tem exatamente 12 colunas, que o drag-and-drop atualiza o banco e registra histórico. Perguntar ao usuário se há ajustes finais.


## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos específicos para rastreabilidade
- Os checkpoints (tarefas 6 e 16) garantem validação incremental
- Os property tests cobrem as 23 propriedades definidas no design usando Vitest + fast-check
- A Meta API e a OpenAI devem ser sempre mockadas nos testes de propriedade
- O Prisma deve usar `DATABASE_URL="file::memory:?cache=shared"` nos testes de integração

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.3", "2.5", "2.7"] },
    { "id": 2, "tasks": ["2.2", "2.4", "2.6", "2.8", "3.1", "3.3", "5.1", "5.3", "5.5", "5.6", "5.7", "5.9"] },
    { "id": 3, "tasks": ["3.2", "3.4", "4.1", "4.2", "5.2", "5.4", "5.8", "7.1", "7.2", "9.1"] },
    { "id": 4, "tasks": ["4.3", "7.3", "7.4", "8.1", "9.2"] },
    { "id": 5, "tasks": ["8.2", "9.3", "9.4", "10.2", "10.4", "15.1"] },
    { "id": 6, "tasks": ["9.5", "10.1", "10.3", "10.5", "13.1"] },
    { "id": 7, "tasks": ["10.6", "10.7", "10.8", "11.1", "12.1", "13.2", "14.1", "15.2"] },
    { "id": 8, "tasks": ["13.3"] }
  ]
}
```
