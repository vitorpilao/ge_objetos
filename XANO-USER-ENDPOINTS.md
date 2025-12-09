# 👥 Guia de Criação de Endpoints de Usuários no Xano

Este guia detalha como criar os endpoints necessários para o painel administrativo gerenciar usuários.

---

## 📋 Pré-requisitos

Você já deve ter a tabela `user` criada no Xano com os seguintes campos:
- `id` (integer, primary key, auto-increment)
- `name` (text)
- `email` (text, unique)
- `password` (text, encrypted)
- `created_at` (timestamp, default: now)
- `role` (text, default: 'user') - **NOVO CAMPO**
- `is_active` (boolean, default: true) - **NOVO CAMPO**
- `last_login` (timestamp, nullable) - **NOVO CAMPO**

---

## 🆕 Passo 1: Adicionar Novos Campos à Tabela `user`

1. Acesse o **Xano Dashboard**
2. Vá em **Database → user**
3. Clique em **Add Field** para cada campo:

### Campo: `role`
- **Type:** Text
- **Default Value:** `member`
- **Description:** Função do usuário (member, admin)

### Campo: `is_active`
- **Type:** Boolean
- **Default Value:** `true`
- **Description:** Indica se o usuário está ativo

### Campo: `last_login`
- **Type:** Timestamp
- **Default Value:** (deixe vazio)
- **Allow Null:** ✅ Sim
- **Description:** Data/hora do último login

---

## 🔧 Passo 2: Criar Endpoints na API

### 📌 **Endpoint 1: GET /admin/users**
Lista todos os usuários (apenas para admins)

**Configuração:**
1. Vá em **API → Add Endpoint**
2. **Path:** `/admin/users`
3. **Method:** GET
4. **Authentication:** Required (Bearer Token)

**Function Stack:**

```
1. Authenticate Request
   - Add-on: Authentication
   - Input: Bearer Token from headers
   - Output: authenticated_user

2. Check Admin Permission
   - Function: Run Function
   - Code:
     if (user.role !== 'admin') {
       return { error: 'Unauthorized', status: 403 }
     }
   
3. Query All Users
   - Function: Query All Records
   - Table: user
   - Sort: created_at DESC
   - Output: users_list

4. Format Response
   - Function: Run Function
   - Code:
     const users = users_list.map(user => ({
       id: user.id,
       name: user.name,
       email: user.email,
       role: user.role || 'user',
       is_active: user.is_active !== false,
       created_at: user.created_at,
       last_login: user.last_login
     }))
     return { users, total: users.length }
```

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@impacta.com",
      "role": "admin",
      "is_active": true,
      "created_at": 1702000000,
      "last_login": 1702050000
    }
  ],
  "total": 10
}
```

---

### 📌 **Endpoint 2: GET /admin/users/{user_id}**
Busca um usuário específico

**Configuração:**
1. **Path:** `/admin/users/{user_id}`
2. **Method:** GET
3. **Authentication:** Required
4. **Path Parameter:** `user_id` (integer)

**Function Stack:**

```
1. Authenticate Request
   - Authentication required

2. Check Admin Permission
   - Verify user.role === 'admin'

3. Query User by ID
   - Function: Query Single Record
   - Table: user
   - Filter: id = {user_id}
   - Output: user_data

4. Return User Data
   - Return filtered user object (sem senha)
```

**Response:**
```json
{
  "id": 5,
  "name": "João Silva",
  "email": "joao@example.com",
  "role": "user",
  "is_active": true,
  "created_at": 1702000000,
  "last_login": 1702050000
}
```

---

### 📌 **Endpoint 3: POST /admin/users**
Cria um novo usuário

**Configuração:**
1. **Path:** `/admin/users`
2. **Method:** POST
3. **Authentication:** Required

**Body Parameters:**
- `name` (text, required)
- `email` (text, required)
- `password` (text, required)
- `role` (text, optional, default: 'member')
- `is_active` (boolean, optional, default: true)

**Function Stack:**

```
1. Authenticate Request
   - Authentication required

2. Check Admin Permission
   - Verify user.role === 'admin'

3. Validate Email Format
   - Function: Run Function
   - Code:
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
     if (!emailRegex.test(email)) {
       return { error: 'Email inválido', status: 400 }
     }

4. Check Email Exists
   - Function: Query Single Record
   - Table: user
   - Filter: email = {email}
   - If exists: Return error 'Email já cadastrado'

5. Hash Password
   - Function: Hash Password
   - Input: password
   - Output: hashed_password

6. Create User
   - Function: Add Record
   - Table: user
   - Fields:
     * name: {name}
     * email: {email}
     * password: {hashed_password}
     * role: {role} or 'member'
     * is_active: {is_active} or true
     * created_at: now()

7. Return Success
   - Return created user (sem senha)
```

**Response:**
```json
{
  "id": 15,
  "name": "Novo Usuário",
  "email": "novo@example.com",
  "role": "member",
  "is_active": true,
  "created_at": 1702060000,
  "message": "Usuário criado com sucesso"
}
```

---

### 📌 **Endpoint 4: PATCH /admin/users/{user_id}**
Atualiza um usuário existente

**Configuração:**
1. **Path:** `/admin/users/{user_id}`
2. **Method:** PATCH
3. **Authentication:** Required
4. **Path Parameter:** `user_id` (integer)

**Body Parameters (todos opcionais):**
- `name` (text)
- `email` (text)
- `role` (text)
- `is_active` (boolean)
- `password` (text) - se fornecido, será alterado

**Function Stack:**

```
1. Authenticate Request
   - Authentication required

2. Check Admin Permission
   - Verify user.role === 'admin'

3. Get Current User Data
   - Query user by ID
   - If not found: Return 404

4. Prepare Update Fields
   - Function: Run Function
   - Code:
     const updates = {}
     if (name !== undefined) updates.name = name
     if (email !== undefined) {
       // Verificar se email já existe para outro usuário
       const existing = await queryUserByEmail(email)
       if (existing && existing.id !== user_id) {
         return { error: 'Email já em uso', status: 400 }
       }
       updates.email = email
     }
     if (role !== undefined) updates.role = role
     if (is_active !== undefined) updates.is_active = is_active
     if (password !== undefined) {
       updates.password = hashPassword(password)
     }

5. Update User Record
   - Function: Edit Record
   - Table: user
   - ID: {user_id}
   - Fields: {updates}

6. Return Updated User
   - Query updated user
   - Return without password
```

**Response:**
```json
{
  "id": 5,
  "name": "João Silva Atualizado",
  "email": "joao.novo@example.com",
  "role": "editor",
  "is_active": true,
  "created_at": 1702000000,
  "last_login": 1702050000,
  "message": "Usuário atualizado com sucesso"
}
```

---

### 📌 **Endpoint 5: DELETE /admin/users/{user_id}**
Deleta um usuário (ou desativa)

**Configuração:**
1. **Path:** `/admin/users/{user_id}`
2. **Method:** DELETE
3. **Authentication:** Required
4. **Path Parameter:** `user_id` (integer)

**Query Parameter (opcional):**
- `soft_delete` (boolean, default: true) - Se true, apenas desativa. Se false, deleta permanentemente.

**Function Stack:**

```
1. Authenticate Request
   - Authentication required

2. Check Admin Permission
   - Verify user.role === 'admin'

3. Prevent Self-Deletion
   - Function: Run Function
   - Code:
     if (user_id === authenticated_user.id) {
       return { error: 'Você não pode deletar sua própria conta', status: 400 }
     }

4. Get User to Delete
   - Query user by ID
   - If not found: Return 404

5. Check if Soft Delete
   - If soft_delete === true (default):
     * Update user: is_active = false
     * Return success message
   - If soft_delete === false:
     * Delete record permanently
     * Return success message
```

**Response (Soft Delete):**
```json
{
  "message": "Usuário desativado com sucesso",
  "user_id": 5,
  "deleted": false,
  "deactivated": true
}
```

**Response (Hard Delete):**
```json
{
  "message": "Usuário deletado permanentemente",
  "user_id": 5,
  "deleted": true
}
```

---

### 📌 **Endpoint 6: GET /admin/stats**
Retorna estatísticas gerais do sistema

**Configuração:**
1. **Path:** `/admin/stats`
2. **Method:** GET
3. **Authentication:** Required

**Function Stack:**

```
1. Authenticate Request
   - Authentication required

2. Check Admin Permission
   - Verify user.role === 'admin'

3. Count Total Users
   - Function: Aggregate
   - Table: user
   - Operation: COUNT
   - Output: total_users

4. Count Active Users
   - Function: Aggregate
   - Table: user
   - Filter: is_active = true
   - Operation: COUNT
   - Output: active_users

5. Count Total Objects
   - Function: Aggregate
   - Table: objeto_interativo
   - Operation: COUNT
   - Output: total_objects

6. Get Object Types Distribution
   - Function: Query All Records
   - Table: objeto_interativo
   - Group By: tipo
   - Output: objects_by_type

7. Get Recent Users
   - Function: Query Records
   - Table: user
   - Sort: created_at DESC
   - Limit: 5
   - Output: recent_users

8. Format Response
   - Return formatted statistics
```

**Response:**
```json
{
  "total_users": 45,
  "active_users": 42,
  "inactive_users": 3,
  "total_objects": 128,
  "object_types": {
    "multiplechoice": 45,
    "dragdrop": 32,
    "flashcard": 28,
    "flipcard": 15,
    "encontreerro": 8
  },
  "recent_users": [
    {
      "id": 45,
      "name": "Último Usuário",
      "email": "ultimo@example.com",
      "created_at": 1702060000
    }
  ]
}
```

---

## 🔒 Passo 3: Configurar Permissões

Para cada endpoint criado:

1. Vá em **Settings → Authentication**
2. Marque **Require Authentication**
3. Em **Advanced**, adicione validação de role:

```javascript
// No início de cada endpoint admin
if (user.role !== 'admin') {
  return response({
    error: 'Acesso negado. Apenas administradores.',
    status: 403
  }, 403)
}
```

---

## 🧪 Passo 4: Testar Endpoints

Use o **Xano API Tester** ou **Postman**:

### Teste 1: Listar Usuários
```http
GET https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn/admin/users
Authorization: Bearer YOUR_TOKEN
```

### Teste 2: Criar Usuário
```http
POST https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn/admin/users
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Teste User",
  "email": "teste@example.com",
  "password": "senha123",
  "role": "member",
  "is_active": true
}
```

### Teste 3: Atualizar Usuário
```http
PATCH https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn/admin/users/5
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "role": "editor"
}
```

### Teste 4: Desativar Usuário
```http
DELETE https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn/admin/users/5?soft_delete=true
Authorization: Bearer YOUR_TOKEN
```

---

## 📝 Próximos Passos

Após criar os endpoints:

1. ✅ Testar cada endpoint no Xano
2. ✅ Verificar autenticação e permissões
3. ✅ Atualizar `admin-panel.js` com os novos endpoints
4. ✅ Implementar funções CRUD no painel admin
5. ✅ Adicionar formulários de criação/edição de usuários
6. ✅ Testar fluxo completo no navegador

---

## 🆘 Troubleshooting

### Erro: "Unauthorized"
- Verifique se o token está sendo enviado corretamente
- Verifique se o usuário tem `role: 'admin'`

### Erro: "Email já cadastrado"
- Use um email diferente
- Verifique se não há duplicatas no banco

### Erro 500
- Verifique logs no Xano
- Verifique se todos os campos obrigatórios estão preenchidos
- Verifique se a tabela user tem todos os campos necessários

---

## 📚 Referências

- [Xano Documentation](https://docs.xano.com)
- [Xano Authentication Guide](https://docs.xano.com/authentication)
- [REST API Best Practices](https://restfulapi.net/)

---

**Criado em:** 05/12/2025  
**Última atualização:** 05/12/2025
