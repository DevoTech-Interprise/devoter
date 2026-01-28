# 🔄 Atualização: Cálculo Automático de Votos Alcançados

## 📝 O que foi alterado?

Os **votos alcançados** agora são calculados **automaticamente** baseado no número de pessoas que a lideança convidou para a rede, em vez de serem inseridos manualmente.

---

## 🔧 Como Funciona?

### Antes (Manual):
```
1. Política acessa a página de progresso
2. Clica em "Editar" na lideança
3. Digita manualmente quantos votos alcançou
4. Salva os dados
```

### Agora (Automático):
```
1. Clica no botão "🔄 Sincronizar" (azul)
2. Sistema busca a rede de convidados da lideança
3. Conta quantas pessoas foram convidadas
4. Atualiza automaticamente os votos alcançados
```

---

## 🆕 Novos Botões

### 1️⃣ Botão "Sincronizar" (Azul com ícone RefreshCw)

**Localização:** 
- Página de Progresso das Lideranças
- Página de Gerenciamento de Lideranças

**Função:**
- Recalcula os votos alcançados automaticamente
- Busca quantas pessoas a lideança convidou
- Atualiza em tempo real

**Exemplo:**
```
Lideança: João Silva
┌─────────────────────────────────────────┐
│ João Silva                  [🔄][✏️][🗑️] │
│ joao@email.com • 8199999999             │
│                                         │
│ Votos Prometidos: 300                   │
│ Votos Esperados: 500                    │
│ Votos Alcançados: 0 (antes)             │
│ [Clica em 🔄]                           │
│ Votos Alcançados: 47 (depois)           │
│ "47 pessoas convidadas"                 │
└─────────────────────────────────────────┘
```

---

## 📊 Como os Votos são Calculados?

O sistema faz o seguinte:

1. **Busca a rede** da lideança via API: `GET /api/network/tree/:userId`

2. **Conta todos os convidados recursivamente**:
```json
Exemplo de resposta:
{
  "id": 30,
  "name": "João Silva",
  "children": [
    {
      "id": 40,
      "name": "Convidado 1",
      "children": [
        { "id": 50, "name": "Convidado 1.1", "children": [] }
      ]
    },
    {
      "id": 41,
      "name": "Convidado 2",
      "children": []
    }
  ]
}

Total de votos alcançados = 3 pessoas (40, 50, 41)
```

3. **Atualiza a API** com o novo valor: `PUT /api/campaign-managers/:id/votes`

---

## 🎯 Benefícios

✅ **Automático** - Não precisa digitar manualmente  
✅ **Preciso** - Conta exatamente quantas pessoas foram convidadas  
✅ **Em Tempo Real** - Atualiza conforme novas pessoas são convidadas  
✅ **Sem Erros** - Elimina erros de digitação  

---

## 🔌 Novas Funções de Serviço

### `networkService.countNetworkMembers(networkUser)`

Conta quantas pessoas estão na rede (excluindo a própria lideança).

```typescript
const network = await networkService.getNetworkTree(userId);
const totalMembers = networkService.countNetworkMembers(network);
// Result: 47
```

### `networkService.countDirectInvites(networkUser)`

Conta apenas os convites diretos (filhos imediatos).

```typescript
const directInvites = networkService.countDirectInvites(network);
// Result: 5 (apenas os que essa pessoa convidou direto)
```

---

## 🔄 Fluxo de Sincronização

```
┌─ Página de Progresso ──────────────┐
│                                     │
│  Lideranças da Campanha            │
│  ┌──────────────────────────────┐  │
│  │ João Silva                   │  │
│  │ [🔄 Sincronizar] [✏️] [🗑️]   │  │
│  └──────────────────────────────┘  │
│                ↓                    │
│       Clique em "Sincronizar"      │
│                ↓                    │
│  networkService.getNetworkTree()   │
│           ↓           ↓             │
│    API busca rede   Resposta       │
│                ↓                    │
│  networkService.countNetworkMembers()│
│           ↓                         │
│    Total de convidados = 47        │
│                ↓                    │
│  campaignService.updateManagerVotes│
│           ↓                         │
│    Votos Alcançados = 47           │
│                ↓                    │
│  Toast: "47 pessoas convidadas"    │
│                ↓                    │
│     Página recarrega               │
│                ↓                    │
│   Card mostra: 47 votos alcançados │
│                                     │
└─────────────────────────────────────┘
```

---

## 📱 Exemplo Prático

### Cenário:
Você é o político "Rogéria Santos" e quer verificar quantas pessoas "João Silva" (sua lideança) conseguiu convidar.

### Processo:

**1. Acesso à Campanha:**
```
Campanhas → "Rogéria Santos - Em ação" → Botão "Lideranças"
```

**2. Vê a Lista de Lideranças:**
```
┌─────────────────────────────────────┐
│ João Silva          [🔄][✏️][🗑️]    │
│ joao@email.com • 8199999999         │
│                                     │
│ Votos Prometidos: 300               │
│ Votos Esperados: 500                │
│ Votos Alcançados: 0                 │
└─────────────────────────────────────┘
```

**3. Clica em "Sincronizar" (botão azul):**
- Sistema carrega a rede de convidados de João
- Conta: 1 + 2 (subconvidados) + 1 (sub-subconvidado) = 4 pessoas
- Atualiza para: 4 votos alcançados

**4. Resultado:**
```
┌─────────────────────────────────────┐
│ João Silva          [🔄][✏️][🗑️]    │
│ joao@email.com • 8199999999         │
│                                     │
│ Votos Prometidos: 300               │
│ Votos Esperados: 500                │
│ Votos Alcançados: 4 ✨              │
│ Taxa de Conversão: 1% (4 de 500)    │
└─────────────────────────────────────┘
```

**5. Página de Gerenciamento:**
Ao entrar em "Adicionar Lideranças", o botão de sincronizar também está disponível para cada lideança.

---

## ⚙️ Detalhes Técnicos

### Métodos Adicionados ao `networkService`:

```typescript
/**
 * Conta quantas pessoas estão na rede de um usuário
 * Exclui o próprio usuário, conta apenas convidados
 */
countNetworkMembers(networkUser: NetworkUser): number

/**
 * Conta apenas os convites diretos (filhos imediatos)
 */
countDirectInvites(networkUser: NetworkUser): number
```

### Funções Adicionadas às Páginas:

**CampaignLeadersProgress.tsx:**
```typescript
recalculateVotesFromNetwork(manager: CampaignManager)
// Botão: 🔄 Recalcular (cor azul)
```

**AddCampaignManagers.tsx:**
```typescript
syncManagerVotes(manager: CampaignManager)
// Botão: 🔄 Sincronizar (cor azul)
```

---

## 🎨 Visual dos Botões

| Botão | Cor | Ícone | Função |
|-------|-----|-------|--------|
| 🔄 | Azul | RefreshCw | Sincronizar votos automático |
| ✏️ | Amarelo | Edit2 | Editar manualmente |
| 🗑️ | Vermelho | Trash2 | Remover lideança |

---

## 🔒 Permissões

- ✅ Super Users: Podem sincronizar qualquer lideança
- ✅ Criadores de Campanha: Podem sincronizar suas lideranças
- ❌ Outros: Sem acesso

---

## 💡 Dica de Uso

**Quando usar "Sincronizar":**
- 🔄 Diariamente, para atualizar progresso
- 🔄 Após reuniões com lideranças
- 🔄 Quando há dúvidas sobre números
- 🔄 Para comparar votos alcançados vs. esperados

**Quando usar "Editar manualmente":**
- ✏️ Para corrigir erros
- ✏️ Para ajustar metas futuras
- ✏️ Para adicionar votos de outras fontes

---

## 🆘 Troubleshooting

**Problema:** "Sincronizar" não atualiza os votos
- ✓ Verifique conexão com a API
- ✓ Confirme que a rede da lideança foi carregada
- ✓ Tente novamente

**Problema:** Votos mostram zero após sincronizar
- ✓ Verificar se a lideança convidou alguém
- ✓ A rede pode estar vazia

**Problema:** O botão fica carregando infinitamente
- ✓ Recarregue a página
- ✓ Verifique a conexão de internet

---

**Status**: ✅ Implementado e testado  
**Data**: 27 de Janeiro de 2026  
**Versão**: 1.0
