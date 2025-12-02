# 🚀 Migração para Xano - Guia de Ativação

## ✅ Arquivos Criados

Criei duas novas versões dos arquivos que se conectam com suas APIs do Xano:

1. **`js/auth-xano.js`** - Versão com autenticação Xano
2. **`js/storage-manager-xano.js`** - Versão com API de objetos Xano

---

## 🔧 Como Ativar a Versão Xano

### **Passo 1: Backup dos arquivos atuais**

Renomeie os arquivos atuais (LocalStorage) para manter como backup:

```
js/auth.js → js/auth-local.js
js/storage-manager.js → js/storage-manager-local.js
```

### **Passo 2: Ativar arquivos Xano**

Renomeie os novos arquivos para os nomes originais:

```
js/auth-xano.js → js/auth.js
js/storage-manager-xano.js → js/storage-manager.js
```

### **Passo 3: Verificar configurações da API**

Abra os arquivos e verifique se as URLs estão corretas:

**`js/auth.js` (linha 5):**
```javascript
API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn'
```

**`js/storage-manager.js` (linha 5):**
```javascript
API_BASE_URL: 'https://x8ki-letl-twmt.n7.xano.io/api:GFL6p7bC'
```

### **Passo 4: Limpar dados locais (opcional)**

Como está mudando de LocalStorage para Xano, os dados antigos não serão mais usados. Você pode:

1. Abrir o Console (F12)
2. Executar: `localStorage.clear()`
3. Recarregar a página

---

## 🧪 Como Testar

### **1. Testar Autenticação**

**Criar nova conta:**
1. Acesse `login.html`
2. Clique em "Registre-se"
3. Preencha: Nome, E-mail, Senha
4. Clique em "Criar Conta"
5. Deve redirecionar para `index.html`

**Fazer login:**
1. Acesse `login.html`
2. Digite e-mail e senha
3. Clique em "Entrar"
4. Deve redirecionar para `index.html`

**Verificar no Console (F12):**
- Deve aparecer logs de sucesso
- Não deve aparecer erros de CORS
- Token deve ser salvo na sessão

### **2. Testar Objetos**

**Salvar objeto:**
1. Crie um objeto (ex: Múltipla Escolha)
2. Clique em "💾 Salvar"
3. Digite um nome
4. Clique em "Salvar"
5. Deve mostrar mensagem de sucesso

**Listar objetos:**
1. Clique em "📚 Objetos Salvos"
2. Deve mostrar o objeto criado
3. Deve exibir: nome, tipo, data, criador

**Editar objeto:**
1. Na lista, clique em "✏️ Editar"
2. Modifique o objeto
3. Clique em "💾 Salvar" novamente
4. Deve atualizar no banco

**Duplicar objeto:**
1. Na lista, clique em "📋 Duplicar"
2. Deve criar uma cópia com "(cópia)" no nome

**Deletar objeto:**
1. Na lista, clique em "🗑️ Excluir"
2. Confirme a exclusão
3. Objeto deve sumir da lista

### **3. Verificar no Xano**

Acesse seu painel do Xano:
- Vá em "Database"
- Verifique a tabela `users` - deve ter usuários criados
- Verifique a tabela `objeto_interativo` - deve ter objetos salvos

---

## 🔍 Troubleshooting

### **Erro CORS**

Se aparecer erro de CORS no console:

1. No Xano, vá em Settings → CORS
2. Adicione a origem do seu site (ex: `http://localhost` ou seu domínio)
3. Ou configure para aceitar todas: `*`

### **Erro 401 (Não autorizado)**

- Verifique se o token está sendo salvo no localStorage
- Abra Console (F12) e digite: `localStorage.getItem('ge_session')`
- Deve retornar um JSON com o `authToken`

### **Erro 404 (Not Found)**

- Verifique se as URLs das APIs estão corretas
- Confirme que os endpoints existem no Xano
- Verifique o nome exato: `objeto_interativo` vs `objetos`

### **Dados não aparecem**

1. Abra Console (F12)
2. Vá na aba "Network"
3. Faça uma ação (ex: listar objetos)
4. Veja a requisição GET para `/objeto_interativo`
5. Verifique a resposta - deve retornar array de objetos

---

## 📊 Estrutura de Dados Esperada

### **Resposta do Login/Signup (`/auth/login` ou `/auth/signup`):**

```json
{
  "id": 123,
  "name": "João Silva",
  "email": "joao@example.com",
  "authToken": "eyJhbGc..."
}
```

### **Resposta de Listar Objetos (`GET /objeto_interativo`):**

```json
[
  {
    "id": 1,
    "user_id": 123,
    "nome": "Quiz de JavaScript",
    "tipo": "multiplechoice",
    "dados_formulario": { ... },
    "codigo_html": "<div>...</div>",
    "created_by": "João Silva",
    "updated_by": "João Silva",
    "created_at": "2025-11-27T10:30:00Z",
    "updated_at": "2025-11-27T10:30:00Z"
  }
]
```

---

## ⚙️ Configurações Opcionais

### **Remover usuário demo**

Como agora usa API real, não precisa mais do usuário demo. Mas ele não atrapalha.

### **Adicionar mais validações**

Se quiser, pode adicionar validações extras nos formulários de login/signup.

### **Mensagens de erro customizadas**

Edite as mensagens nos arquivos `auth.js` e `storage-manager.js`.

---

## 📝 Próximos Passos

Após testar e confirmar que está funcionando:

1. ✅ Delete os arquivos de backup (`auth-local.js` e `storage-manager-local.js`)
2. ✅ Configure HTTPS no seu site (obrigatório para produção)
3. ✅ Adicione validações de permissões no Xano (se necessário)
4. ✅ Configure backup automático dos dados no Xano
5. ✅ Teste em diferentes navegadores

---

## 🎯 Checklist de Ativação

- [ ] Backup dos arquivos originais feito
- [ ] Arquivos Xano renomeados para `auth.js` e `storage-manager.js`
- [ ] URLs das APIs verificadas
- [ ] LocalStorage limpo (opcional)
- [ ] Teste de criar conta realizado
- [ ] Teste de login realizado
- [ ] Teste de salvar objeto realizado
- [ ] Teste de listar objetos realizado
- [ ] Teste de editar objeto realizado
- [ ] Teste de deletar objeto realizado
- [ ] Dados verificados no painel do Xano
- [ ] Console sem erros
- [ ] Sistema funcionando 100%

---

**Pronto! Se tiver qualquer erro, me avise e eu ajudo a corrigir!** 🚀
