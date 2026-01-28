# Implementação: Página de Progresso de Lideranças Policiais

## 📋 Resumo

Foi implementado um sistema completo para gerenciar e visualizar o progresso de lideranças policiais em campanhas. O político agora consegue:

1. ✅ Visualizar todas as lideranças vinculadas à campanha
2. ✅ Ver o progresso de votos (prometidos, esperados e alcançados)
3. ✅ Editar metas de votos das lideranças
4. ✅ Adicionar ou remover lideranças da campanha
5. ✅ Ver progresso geral em percentual

---

## 🗂️ Arquivos Criados/Modificados

### 1. **[src/services/campaignService.ts](src/services/campaignService.ts)**
Adicionados 5 novos métodos para gerenciar campaign managers:

```typescript
// Buscar managers de uma campanha
async getCampaignManagers(campaignId: string | number)

// Adicionar um novo manager
async addCampaignManager(campaignId, userId, votesPromised, votesExpected)

// Atualizar metas (votos prometidos e esperados)
async updateCampaignManagerGoals(managerId, votesPromised, votesExpected)

// Atualizar votos alcançados
async updateCampaignManagerVotes(managerId, votesAchieved)

// Remover um manager
async removeCampaignManager(managerId)
```

### 2. **[src/pages/campaign/CampaignLeadersProgress.tsx](src/pages/campaign/CampaignLeadersProgress.tsx)** (NOVO)
Página para visualizar o progresso de todas as lideranças de uma campanha.

**Features:**
- Card com resumo geral (total de managers, votos esperados, prometidos e alcançados)
- Barra de progresso geral com percentual
- Lista de cards para cada lideança com:
  - Nome, email e telefone
  - Votos alcançados vs prometidos
  - Votos alcançados vs esperados
  - Duas barras de progresso
  - Botão de editar metas
  - Botão de remover lideança
- Modal para editar votos da lideança
- Só usuários que criam a campanha podem editar/remover

### 3. **[src/pages/campaign/AddCampaignManagers.tsx](src/pages/campaign/AddCampaignManagers.tsx)** (NOVO)
Página para adicionar e gerenciar lideranças em uma campanha.

**Features:**
- Dropdown para selecionar lideranças disponíveis (não associadas a nenhuma campanha)
- Campos para definir votos prometidos e esperados
- Lista de managers já adicionados
- Botão para remover managers
- Modal para adicionar novos managers

### 4. **[src/hooks/useCampaignColor.ts](src/hooks/useCampaignColor.ts)** (NOVO)
Hook para acessar as cores da campanha ativa.

```typescript
const { primaryColor, secondaryColor } = useCampaignColor();
```

### 5. **[src/context/CampaignContext.tsx](src/context/CampaignContext.tsx)** (MODIFICADO)
Atualizado para incluir cores da campanha:
- `primaryColor` - Cor primária da campanha
- `secondaryColor` - Cor secundária da campanha

### 6. **[src/pages/campaign/campaign.tsx](src/pages/campaign/campaign.tsx)** (MODIFICADO)
Adicionado:
- Botão "Lideranças" em cada card de campanha (ícone TrendingUp em cor roxa)
- Navegação para a página de progresso das lideranças
- Correção de import do `useCampaignColor`

### 7. **[src/App.tsx](src/App.tsx)** (MODIFICADO)
Adicionadas 2 novas rotas:

```typescript
// Visualizar progresso das lideranças
/campanhas/:campaignId/lideranças

// Gerenciar (adicionar/remover) lideranças
/campanhas/:campaignId/adicionar-lideranças
```

---

## 🔌 Integração com APIs

Todas as chamadas já estão funcionando com as rotas que você forneceu:

### POST `/api/campaign-managers`
Adiciona um novo manager a uma campanha
```json
{
  "campaign_id": 49,
  "user_id": 30,
  "votes_promised": 300,
  "votes_expected": 500
}
```

### PUT `/api/campaign-managers/:id`
Atualiza metas de votos
```json
{
  "votes_promised": 100,
  "votes_expected": 300
}
```

### PUT `/api/campaign-managers/:id/votes`
Atualiza votos alcançados
```json
{
  "votes_achieved": 280
}
```

### GET `/api/campaign-managers/campaign/:campaignId`
Retorna campanha + todos os managers com dados de progresso

### DELETE `/api/campaign-managers/:id`
Remove um manager da campanha

---

## 🎨 Design

- ✅ Respeitando tema claro/escuro
- ✅ Cards com sombras e bordas
- ✅ Cores primárias e secundárias da campanha
- ✅ Ícones do Lucide React
- ✅ Barras de progresso animadas
- ✅ Modais para edição
- ✅ Toasts para feedback do usuário

---

## 🔐 Permissões

- **Super User**: Pode ver todas as campanhas e gerenciar lideranças
- **Criador da Campanha**: Pode gerenciar suas próprias lideranças
- **Outros usuários**: Visualização apenas (sem edição/remoção)

---

## 📱 Fluxo de Uso

1. **Visualizar Campanhas** → `/campanhas`
2. **Clicar em "Lideranças"** → `/campanhas/:id/lideranças`
3. **Ver Progresso das Lideranças** com resumo geral
4. **Clicar em "Adicionar Lideranças"** → `/campanhas/:id/adicionar-lideranças`
5. **Selecionar Lideranças Disponíveis** e definir votos
6. **Editar Progresso** → Modal de edição na página de progresso
7. **Remover Lideranças** → Confirmação e remoção

---

## ✨ Recursos Adicionais

- Dark mode suportado em todas as páginas
- Loading spinners durante requisições
- Mensagens de erro e sucesso com toasts
- Validações de formulário
- Cálculos automáticos de progresso em percentual

---

## 🚀 Próximos Passos (Opcional)

Você pode considerar:
1. Adicionar gráficos de comparação entre managers
2. Exportar relatório de progresso (PDF/Excel)
3. Adicionar notificações quando uma meta for atingida
4. Histórico de mudanças de votos
5. Filtros avançados (por data, progresso, etc)

---

**Status**: ✅ Implementado e testado sem erros de compilação
**Data**: 27 de Janeiro de 2026
