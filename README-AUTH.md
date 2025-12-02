# 🎨 Central de Componentes - Sistema de Autenticação

## ✨ O que foi implementado

### 1. **Sistema de Login e Registro** (`login.html`)
- Tela de login profissional com animações suaves
- Formulário de registro para novos usuários
- Validação de campos
- Feedback visual (toasts)
- Design moderno e responsivo

### 2. **Barra de Usuário** (no `index.html`)
Localizada no topo da página principal com:
- 👋 Nome do usuário logado
- 🆕 **Novo** - Limpa o formulário para criar novo objeto
- 💾 **Salvar** - Salva o objeto atual (novo ou atualização)
- 📚 **Meus Objetos** - Lista todos os objetos salvos
- 📥 **Exportar** - Baixa todos os objetos em JSON
- 📤 **Importar** - Importa objetos de arquivo JSON
- 🚪 **Sair** - Faz logout

### 3. **Gerenciamento de Objetos**
- **Salvar**: Salva o objeto atual com um nome personalizado
- **Editar**: Carrega objeto salvo de volta no formulário
- **Duplicar**: Cria uma cópia do objeto
- **Excluir**: Remove objeto (com confirmação)
- **Exportar/Importar**: Backup e restauração de objetos

### 4. **Indicador de Edição**
Mostra na barra superior qual objeto está sendo editado no momento.

---

## 🚀 Como Testar

### 1. **Acesse a tela de login**
```
Abra: login.html
```

### 2. **Use o usuário demo criado automaticamente**
```
E-mail: demo@example.com
Senha: demo123
```

### 3. **Ou crie uma nova conta**
- Clique em "Registre-se"
- Preencha nome, e-mail e senha
- Clique em "Criar Conta"

### 4. **Após o login**
- Você será redirecionado para `index.html`
- Crie um objeto interativo normalmente
- Clique em **💾 Salvar** para salvar
- Digite um nome e confirme

### 5. **Ver objetos salvos**
- Clique em **📚 Meus Objetos**
- Veja todos os seus objetos salvos
- Clique em **✏️ Editar** para carregar e editar
- Clique em **📋 Duplicar** para fazer uma cópia
- Clique em **🗑️ Excluir** para remover

---

## 💾 Armazenamento Atual (LocalStorage)

**No momento, os dados estão salvos localmente no navegador:**

### Estrutura de dados:
```javascript
// Usuários
localStorage.ge_users = [
  {
    id: 1234567890,
    name: "João Silva",
    email: "joao@example.com",
    password: "***hashed***",
    created_at: "2025-11-27T..."
  }
]

// Sessão atual
localStorage.ge_session = {
  userId: 1234567890,
  userName: "João Silva",
  userEmail: "joao@example.com",
  token: "***token***",
  created_at: "2025-11-27T..."
}

// Objetos salvos
localStorage.ge_objetos = [
  {
    id: 1234567891,
    user_id: 1234567890,
    nome: "Quiz de JavaScript",
    tipo: "multiplechoice",
    dados_formulario: { ... },
    codigo_html: "...",
    created_at: "2025-11-27T...",
    updated_at: "2025-11-27T..."
  }
]
```

### ⚠️ Importante:
- Os dados ficam **apenas no seu navegador**
- Se limpar o cache/cookies, os dados são perdidos
- Use **Exportar** para fazer backup manual
- Cada usuário vê apenas seus próprios objetos

---

## 🔄 Migração para Xano (Futuro)

Quando você criar sua conta no Xano, basta trocar a URL da API:

### Arquivos a modificar:

**1. `js/auth.js`** - Descomentar e configurar:
```javascript
// Trocar de LocalStorage para API do Xano
const AuthManager = {
    apiURL: 'https://seu-workspace.xano.io/api:sua-branch',
    // ... resto do código
}
```

**2. `js/storage-manager.js`** - Descomentar e configurar:
```javascript
// Trocar de LocalStorage para API do Xano
const StorageManager = {
    apiURL: 'https://seu-workspace.xano.io/api:sua-branch',
    // ... resto do código
}
```

### Estrutura no Xano:

**Tabela: `users`** (já vem pronta)
```
- id (int, auto-increment)
- name (text)
- email (text, unique)
- password (text, hashed)
- created_at (timestamp)
```

**Tabela: `objetos_interativos`** (criar)
```
- id (int, auto-increment)
- user_id (int, foreign key → users.id)
- nome (text)
- tipo (text)
- dados_formulario (json)
- codigo_html (text)
- created_at (timestamp)
- updated_at (timestamp)
```

**APIs necessárias:**
- POST `/auth/signup` (já existe)
- POST `/auth/login` (já existe)
- GET `/auth/me` (já existe)
- POST `/auth/logout` (já existe)
- GET `/objetos` - Listar objetos do usuário
- POST `/objetos` - Criar objeto
- GET `/objetos/{id}` - Buscar objeto
- PATCH `/objetos/{id}` - Atualizar objeto
- DELETE `/objetos/{id}` - Deletar objeto

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- ✅ `login.html` - Tela de login/registro
- ✅ `css/auth.css` - Estilos de autenticação
- ✅ `css/modals.css` - Estilos dos modais e barra de usuário
- ✅ `js/auth.js` - Sistema de autenticação
- ✅ `js/storage-manager.js` - Gerenciador de objetos salvos

### Arquivos Modificados:
- ✅ `index.html` - Adicionada barra de usuário e modais
- ✅ Proteção de autenticação no carregamento

---

## 🎯 Fluxo Completo

```
1. Usuário acessa a aplicação
   ↓
2. Redireciona para login.html (se não logado)
   ↓
3. Faz login ou se registra
   ↓
4. Sessão é criada e salva no localStorage
   ↓
5. Redireciona para index.html
   ↓
6. Cria/edita objetos interativos
   ↓
7. Clica em "Salvar" → Modal aparece
   ↓
8. Digite nome e confirma → Objeto salvo
   ↓
9. Pode ver/editar/duplicar/excluir em "Meus Objetos"
   ↓
10. Pode exportar backup ou importar objetos
   ↓
11. Ao clicar em "Sair" → Volta para login.html
```

---

## 🔐 Recursos de Segurança

### Atual (LocalStorage):
- ✅ Senha com hash simples (não usar em produção!)
- ✅ Verificação de sessão ao carregar páginas
- ✅ Logout limpa sessão
- ✅ Cada usuário vê apenas seus objetos

### Com Xano (Futuro):
- ✅ Senha com bcrypt (automático no Xano)
- ✅ JWT tokens (automático no Xano)
- ✅ HTTPS obrigatório
- ✅ Rate limiting
- ✅ Validação de permissões no backend

---

## 💡 Dicas de Uso

1. **Sempre salve seu trabalho**: Use o botão "Salvar" regularmente
2. **Use nomes descritivos**: Facilita encontrar objetos depois
3. **Faça backup**: Use "Exportar" periodicamente
4. **Teste o usuário demo**: `demo@example.com` / `demo123`
5. **Duplicar é útil**: Para criar variações de objetos

---

## 🐛 Solução de Problemas

### "Não consigo fazer login"
- Verifique se digitou o e-mail e senha corretos
- Use o usuário demo para testar: `demo@example.com` / `demo123`
- Tente criar uma nova conta

### "Meus objetos sumiram"
- Verifique se está logado com o mesmo usuário
- Se limpou o cache do navegador, os dados foram perdidos
- Restaure de um backup exportado

### "Erro ao salvar"
- Preencha todos os campos obrigatórios do objeto
- Gere o preview antes de salvar
- Verifique o console do navegador (F12)

---

## 📞 Próximos Passos

1. ✅ **Testar tudo localmente** (já está pronto!)
2. ⏳ Criar conta no Xano
3. ⏳ Configurar banco de dados no Xano
4. ⏳ Atualizar URLs da API nos arquivos JS
5. ⏳ Deploy em servidor com HTTPS

---

**Pronto para usar! 🎉**

Teste abrindo `login.html` e comece a criar sua biblioteca de objetos interativos!
