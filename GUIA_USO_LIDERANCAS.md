# 🎯 Guia de Uso: Página de Progresso de Lideranças

## 📊 O que é possível fazer?

### 1. Visualizar Progresso das Lideranças

Quando você clica no botão **"Lideranças"** (roxo com ícone de trending up) em um card de campanha, você vai para a página que mostra:

**Resumo Geral:**
```
┌─────────────────────────────────────────────────────────┐
│  📍 Total de Lideranças: 5                              │
│  🎯 Votos Esperados: 2,500                              │
│  ✅ Votos Prometidos: 1,500                             │
│  📈 Votos Alcançados: 1,850 (74% da meta)               │
└─────────────────────────────────────────────────────────┘
```

**Progresso Geral (em barra animada):**
- Mostra uma barra visual do progresso total
- Atualizada em tempo real
- Cor da barra = cor primária da campanha

### 2. Visualizar Cada Lideança

Para cada lideança adicionada, você vê:

```
┌──────────────────────────────────────────────────────────┐
│ 🧑 João Silva                          [Editar] [Remover] │
│ 📧 joao@email.com • 📱 (81) 99999-9999                   │
├──────────────────────────────────────────────────────────┤
│ Votos Prometidos  │ Votos Esperados  │ Taxa de Conversão │
│      150          │       300        │       68%         │
├──────────────────────────────────────────────────────────┤
│ Progresso vs Votos Prometidos: ████████░░ (102/150)      │
│ Progresso vs Votos Esperados:  ██████░░░░ (102/300)      │
└──────────────────────────────────────────────────────────┘
```

### 3. Editar Progresso de uma Lideança

Clique em **"Editar"** (botão amarelo) em qualquer lideança para:

```
Modal de Edição:
┌────────────────────────────────┐
│ Editar Lideança                │
├────────────────────────────────┤
│ Nome: João Silva [desabilitado]│
│ Votos Prometidos: [__________] │
│ Votos Esperados: [___________]│
│ Votos Alcançados: [__________]│
├────────────────────────────────┤
│ [Cancelar]  [Salvar]           │
└────────────────────────────────┘
```

**Exemplo de Uso:**
- Você atualiza os votos prometidos de 300 para 250
- Marca que a lideança alcançou 180 votos
- Clica "Salvar" → Página atualiza instantaneamente

### 4. Adicionar Novas Lideranças

Clique em **"Adicionar Lideranças"** (botão roxo no topo) para:

```
1️⃣  Ir para a página de gerenciamento
2️⃣  Clicar em "Adicionar Lideança"
3️⃣  Preencher o formulário:
    - Selecionar lideança do dropdown
    - Definir votos prometidos
    - Definir votos esperados
4️⃣  Clicar "Adicionar"
```

**Modal de Adição:**
```
┌──────────────────────────────────┐
│ Adicionar Lideança               │
├──────────────────────────────────┤
│ Selecione a Lideança:            │
│ [▼ Robson Augusto Lima...]       │
│                                  │
│ Votos Prometidos: [__________]   │
│ Ex: 300                          │
│                                  │
│ Votos Esperados: [___________]   │
│ Ex: 500                          │
├──────────────────────────────────┤
│ [Cancelar]  [Adicionar]          │
└──────────────────────────────────┘
```

### 5. Remover uma Lideança

Clique em **"Remover"** (botão vermelho X) para excluir uma lideança:
- ⚠️ Será solicitado confirmação
- ✅ A lideança será removida imediatamente
- O progresso será recalculado

---

## 📈 Exemplo Prático Completo

### Cenário:
Você é o político "Rogéria Santos" com a campanha "Em ação"

### Processo:

**1. Acesso à Campanha:**
```
Campanhas → Card "Rogéria Santos - Em ação" → Botão "Lideranças" (roxo)
```

**2. Você vê o resumo:**
```
Total de Lideranças: 2
Votos Esperados: 800 (500 + 300)
Votos Prometidos: 400 (300 + 100)
Votos Alcançados: 380 (280 + 100)
Progresso Geral: 47%
```

**3. Detalhe de cada lideança:**

**Lideraça 1: Robson Augusto**
```
Votos Prometidos: 300
Votos Esperados: 500
Votos Alcançados: 0
Taxa de Conversão: 0%
Progresso: [___________] 0/300 prometido
           [___________] 0/500 esperado
```

**Lideraça 2: Thiago Ramos**
```
Votos Prometidos: 100
Votos Esperados: 300
Votos Alcançados: 280
Taxa de Conversão: 93%
Progresso: [██████████] 280/100 prometido (280%)
           [█████████░] 280/300 esperado (93%)
```

**4. Você edita metas:**
```
Robson está conseguindo mais apoio! Você aumenta:
- Votos Prometidos: 300 → 400
- Votos Esperados: 500 → 700
```

**5. Registra votos:**
```
Depois de uma semana, Robson coleta 150 votos:
- Você clica em "Editar" em Robson
- Muda "Votos Alcançados" para 150
- Salva
- Agora mostra 150/400 (37% do prometido)
```

**6. Adiciona nova lideança:**
```
Você quer adicionar "Maria Silva" como lideraça:
- Clica "Adicionar Lideranças"
- Seleciona "Maria Silva" no dropdown
- Define: 200 votos prometidos, 400 esperados
- Clica "Adicionar"
- Agora tem 3 lideranças!
```

**7. Novo resumo geral:**
```
Total de Lideranças: 3
Votos Esperados: 1,400 (700 + 300 + 400)
Votos Prometidos: 700 (400 + 100 + 200)
Votos Alcançados: 430 (150 + 280 + 0)
Progresso Geral: 31%
```

---

## 🎨 Cores e Elementos

**Cores dos Botões:**
- 🟣 **Roxo**: Ações principais (Lideranças, Adicionar)
- 🟡 **Amarelo**: Editar
- 🔴 **Vermelho**: Remover/Deletar
- 🔵 **Azul**: Alternativas

**Indicadores Visuais:**
- ✅ Verde: Progresso >= 100%
- 🔵 Azul: Progresso >= 75%
- 🟡 Amarelo: Progresso >= 50%
- 🟠 Laranja: Progresso >= 25%
- 🔴 Vermelho: Progresso < 25%

---

## 🔄 Fluxo de Navegação

```
🏠 Dashboard
  ↓
📋 Campanhas
  ├─ Card 1: Campanha A [Botão Lideranças]
  ├─ Card 2: Campanha B [Botão Lideranças]
  └─ Card 3: Campanha C [Botão Lideranças]
  
  ↓ (Clicar em "Lideranças")
  
📊 Progresso das Lideranças
  ├─ Resumo Geral
  ├─ Barra de Progresso Geral
  ├─ Lista de Lideranças
  │  └─ Card de cada Lideança
  │     ├─ [Editar] → Modal de edição
  │     └─ [Remover] → Confirmação
  └─ [Adicionar Lideranças] → Página de gerenciamento

👥 Gerenciar Lideranças
  ├─ Lista atual de lideranças
  ├─ [Adicionar Lideança] → Modal
  │  ├─ Selecionar do dropdown
  │  ├─ Definir votos
  │  └─ [Adicionar]
  └─ Para cada lideança
     └─ [Remover]
```

---

## ⚙️ Detalhes Técnicos

**Permissões:**
- ✅ Criador da campanha: Pode editar/remover tudo
- ✅ Super user: Pode editar/remover tudo
- ❌ Outros: Apenas visualizar

**Filtros de Usuários:**
- Ao adicionar lideranças, são mostrados apenas usuários com role "police_leader"
- Usuários já associados a campanhas não aparecem no dropdown
- Sem limite de lideranças por campanha

**Cálculos Automáticos:**
- Taxa de Conversão = (Votos Alcançados / Votos Prometidos ou Esperados) × 100
- Progresso Geral = (Soma Votos Alcançados / Soma Votos Esperados) × 100
- Tudo recalcula automaticamente ao editar/adicionar/remover

---

## 🆘 Troubleshooting

**Problema**: Não consigo adicionar lideranças
- ✓ Verifique se existem usuários com role "police_leader"
- ✓ Verifique se esses usuários não estão já vinculados a outras campanhas

**Problema**: Os números não estão atualizando
- ✓ Atualize a página (F5)
- ✓ Verifique a conexão com a API

**Problema**: Não vejo o botão de editar
- ✓ Verifique se você é o criador da campanha
- ✓ Super users devem ter acesso total

---

**Pronto! Você agora consegue gerenciar todo o progresso de suas lideranças! 🎉**
