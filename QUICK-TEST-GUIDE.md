# 🚀 Guia Rápido de Testes - Painel Admin

## ⚡ Teste Rápido (5 minutos)

### **Opção 1: Testar via Console do Navegador**

1. **Abra o site:**
   - Abra `index.html` no navegador
   - Faça login com um e-mail admin (`admin@impacta.com` ou `vitor@impacta.com`)

2. **Abra o Console:**
   - Pressione `F12` no teclado
   - Vá na aba **Console**

3. **Execute o script de teste:**
   ```javascript
   // Cole este código no console:
   const script = document.createElement('script');
   script.src = 'test-admin-endpoints.js';
   document.head.appendChild(script);
   ```

4. **Veja os resultados:**
   - ✅ = Teste passou
   - ⚠️ = Endpoint retornou erro (precisa criar no Xano)
   - ❌ = Erro de execução

---

### **Opção 2: Testar via Interface (Recomendado)**

#### **Passo 1: Acesse o Painel Admin**
1. Abra `index.html` no navegador
2. Faça login com e-mail admin
3. Clique no botão **"⚙️ Admin"** no menu lateral
4. Você será redirecionado para `admin.html`

#### **Passo 2: Teste o Dashboard**
- **O que esperar:**
  - 4 cards com números (usuários, objetos, ativos, tipos)
  - Tabela com objetos recentes (últimos 5)
  
- **Se não aparecer:**
  - ⚠️ Endpoint `/admin/stats` não está criado
  - ✅ Sistema usará fallback (dados locais)

#### **Passo 3: Teste Listagem de Usuários**
1. Clique em **"👥 Usuários"** no menu
2. Veja a tabela com todos os usuários
3. Verifique as colunas:
   - Usuário (nome)
   - Email
   - Função (Admin/Editor/Usuário)
   - Objetos (quantidade)
   - Status (Ativo/Inativo)
   - Último Acesso
   - Ações (4 botões)

#### **Passo 4: Teste Criar Usuário**
1. Clique no botão **"➕ Criar Usuário"**
2. Preencha nos prompts:
   - Nome: `João Teste`
   - E-mail: `joao.teste@impacta.com`
   - Senha: `senha123`
   - Função: `member`
3. **Resultado esperado:**
   - ✅ Mensagem "Usuário criado com sucesso!"
   - ✅ Usuário aparece na lista
   - ⚠️ Se der erro: endpoint `POST /admin/users` não criado

#### **Passo 5: Teste Ver Detalhes**
1. Clique no botão **👁️** de qualquer usuário
2. **Resultado esperado:**
   - ✅ Alert com todas as informações
   - Nome, e-mail, função, status, datas

#### **Passo 6: Teste Editar**
1. Clique no botão **✏️** de um usuário
2. Altere o nome (ex: "João Editado")
3. Confirme e altere o e-mail se quiser
4. Altere a função (ex: "editor")
5. **Resultado esperado:**
   - ✅ Mensagem "Usuário atualizado com sucesso!"
   - ✅ Dados atualizados na lista

#### **Passo 7: Teste Ativar/Desativar**
1. Clique no botão **🔄** de um usuário ativo
2. Confirme a ação
3. **Resultado esperado:**
   - ✅ Status muda para "Inativo" (badge vermelho)
4. Clique novamente para reativar
5. **Resultado esperado:**
   - ✅ Status volta para "Ativo" (badge verde)

#### **Passo 8: Teste Excluir**
1. Clique no botão **🗑️** de um usuário
2. Escolha entre:
   - **OK** = Soft Delete (apenas desativar)
   - **Cancelar** = Hard Delete (deletar permanentemente)
3. Confirme a ação
4. **Resultado esperado:**
   - ✅ Usuário removido/desativado da lista
   - ✅ Mensagem de confirmação

---

## 🐛 Checklist de Problemas

### ❌ **Erro: "Botão Admin não aparece"**
**Causa:** Seu e-mail não está na lista de admins  
**Solução:**
1. Abra `index.html`
2. Procure por `adminEmails` (linha ~1070)
3. Adicione seu e-mail:
   ```javascript
   const adminEmails = [
       'admin@impacta.com',
       'vitor@impacta.com',
       'seu.email@impacta.com'  // <- Adicione aqui
   ];
   ```
4. Salve e recarregue a página

### ❌ **Erro: "Acesso negado"**
**Causa:** Usuário não é admin ou não está logado  
**Solução:**
1. Faça logout
2. Faça login com um e-mail da lista de admins
3. Tente acessar novamente

### ⚠️ **Aviso: "Endpoint não disponível"**
**Causa:** Endpoint não foi criado no Xano  
**O que acontece:**
- ✅ Sistema continua funcionando
- ✅ Usa dados locais como fallback
- ⚠️ Funcionalidades limitadas (ex: não pode criar usuários)

**Solução:**
1. Acesse o Xano Dashboard
2. Siga o guia `XANO-USER-ENDPOINTS.md`
3. Crie os endpoints faltantes
4. Recarregue o painel admin

### ❌ **Erro: "Unauthorized" (401)**
**Causa:** Token expirado ou inválido  
**Solução:**
1. Faça logout
2. Faça login novamente
3. Token será renovado automaticamente

### ❌ **Erro: "Forbidden" (403)**
**Causa:** Usuário não tem permissão de admin no backend  
**Solução:**
1. Verifique no Xano se o campo `role` do seu usuário é `"admin"`
2. Se não for, atualize manualmente no banco:
   - Database → user → Encontre seu usuário
   - Edit → role = `"admin"` → Save

---

## 📊 Resultados Esperados

### **Dashboard**
```
┌─────────────────┐ ┌─────────────────┐
│ Total Usuários  │ │ Total Objetos   │
│      45         │ │      128        │
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ Usuários Ativos │ │ Tipos de Obj.   │
│      42         │ │       5         │
└─────────────────┘ └─────────────────┘

Objetos Recentes:
1. Quiz de História (Múltipla Escolha) - João - 08/12/2025
2. Arrastar Palavras (Drag & Drop) - Maria - 07/12/2025
3. Linha do Tempo Brasil (Timeline) - Pedro - 06/12/2025
...
```

### **Lista de Usuários**
```
┌─────────────┬───────────────────────┬───────────┬─────────┬────────┬──────────────┬────────┐
│ Usuário     │ Email                 │ Função    │ Objetos │ Status │ Último Acesso│ Ações  │
├─────────────┼───────────────────────┼───────────┼─────────┼────────┼──────────────┼────────┤
│ Admin User  │ admin@impacta.com     │ 👑 Admin  │ 25      │ Ativo  │ 09/12/2025   │ 👁✏🔄🗑│
│ João Silva  │ joao@impacta.com      │ 👤 Usuário│ 8       │ Ativo  │ 08/12/2025   │ 👁✏🔄🗑│
│ Maria Costa │ maria@impacta.com     │ ✏️ Editor │ 15      │ Ativo  │ 07/12/2025   │ 👁✏🔄🗑│
└─────────────┴───────────────────────┴───────────┴─────────┴────────┴──────────────┴────────┘
```

---

## ✅ Checklist Final

Marque conforme testa:

- [ ] Acessei o painel admin
- [ ] Dashboard carregou com números
- [ ] Lista de usuários apareceu
- [ ] Busca de usuários funciona
- [ ] Criei um novo usuário
- [ ] Visualizei detalhes de um usuário
- [ ] Editei um usuário
- [ ] Ativei/desativei um usuário
- [ ] Excluí um usuário (soft delete)
- [ ] Excluí um usuário (hard delete)
- [ ] Navegação entre seções funciona
- [ ] Console não mostra erros críticos

---

## 🎯 Próximo Passo

Se todos os testes passaram:
✅ **Sistema está funcionando perfeitamente!**

Se alguns falharam:
⚠️ **Verifique quais endpoints precisam ser criados no Xano**
📖 **Consulte:** `XANO-USER-ENDPOINTS.md`

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** ⭐⭐☆☆☆ (Fácil)  
**Pré-requisitos:** Estar logado como admin
