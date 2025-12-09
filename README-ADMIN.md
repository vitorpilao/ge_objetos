# 🔐 Painel Administrativo - Central de Componentes

## Visão Geral

O Painel Administrativo é uma interface exclusiva para administradores do sistema gerenciarem usuários, objetos e visualizarem estatísticas.

## Acesso

### URL
```
admin.html
```

### Permissões
Por padrão, apenas usuários com os seguintes emails têm acesso:
- `admin@impacta.com`
- `vitor@impacta.com`

Para adicionar mais administradores, edite o arquivo `js/admin-panel.js` na linha que contém o array `adminEmails`.

### Como Acessar
1. Faça login normalmente no sistema
2. Se você tiver permissão de admin, aparecerá um botão "🔐 Painel Admin" no menu lateral
3. Clique no botão para acessar o painel administrativo

## Funcionalidades

### 📊 Dashboard
- **Estatísticas Gerais**:
  - Total de usuários cadastrados
  - Total de objetos criados
  - Usuários ativos
  - Tipos de objetos diferentes
- **Objetos Recentes**: Lista dos 5 objetos mais recentemente criados

### 👥 Gerenciamento de Usuários
- **Visualizar todos os usuários** do sistema
- **Buscar usuários** por nome ou email
- **Ver quantidade de objetos** criados por cada usuário
- **Status do usuário** (Ativo/Inativo)
- **Ações disponíveis**:
  - 👁️ Ver detalhes do usuário
  - 🔄 Ativar/Desativar usuário
  - 🔑 Resetar senha

### 📦 Gerenciamento de Objetos
- **Visualizar todos os objetos** do sistema
- **Buscar objetos** por nome, tipo ou criador
- **Ver informações completas**:
  - Nome do objeto
  - Tipo (Acordeão, Drag & Drop, etc.)
  - Criador
  - Data de criação
  - Data de atualização
- **Ações disponíveis**:
  - 👁️ Visualizar objeto (abre preview)
  - ✏️ Editar objeto (redireciona para edição)
  - 🗑️ Excluir objeto

### 📈 Log de Atividades
*(Em desenvolvimento)*
- Registro de todas as ações realizadas no sistema
- Filtros por usuário, ação e data

### ⚙️ Configurações do Sistema
*(Em desenvolvimento)*
- Configurações globais da plataforma
- Gerenciamento de permissões
- Backup e restauração de dados

## Estrutura de Arquivos

```
admin.html              # Página principal do painel admin
js/admin-panel.js       # Lógica do painel administrativo
```

## Segurança

### Verificação de Permissão
O sistema verifica em dois pontos se o usuário tem permissão de admin:

1. **No carregamento da página** (`admin.html`):
   - Se não for admin, redireciona para `index.html`

2. **No menu lateral** (`index.html`):
   - Botão só aparece para usuários admin

### Lista de Administradores
Localizada em `js/admin-panel.js`, método `checkAdminPermission()`:

```javascript
const adminEmails = [
    'admin@impacta.com',
    'vitor@impacta.com'
    // Adicione mais emails aqui
];
```

## Funcionalidades Futuras

### Gestão de Usuários
- [ ] Criar novos usuários
- [ ] Editar informações de usuários
- [ ] Gerenciar roles e permissões
- [ ] Histórico de atividades por usuário

### Gestão de Objetos
- [ ] Aprovar/reprovar objetos
- [ ] Destacar objetos na galeria
- [ ] Exportar objetos em lote
- [ ] Estatísticas de uso por objeto

### Relatórios e Analytics
- [ ] Objetos mais acessados
- [ ] Usuários mais ativos
- [ ] Tipos de objetos mais criados
- [ ] Gráficos de crescimento

### Sistema de Logs
- [ ] Log completo de ações
- [ ] Filtros avançados
- [ ] Exportação de logs

### Configurações
- [ ] Editar textos da interface
- [ ] Gerenciar tipos de objetos disponíveis
- [ ] Configurar limites por usuário
- [ ] Tema e personalização

## Tecnologias Utilizadas

- HTML5
- CSS3 (Grid, Flexbox, Backdrop Filter)
- JavaScript (ES6+)
- Xano API (Backend)

## Desenvolvimento

### Adicionar Novo Administrador
1. Abra `js/admin-panel.js`
2. Localize o array `adminEmails` no método `checkAdminPermission()`
3. Adicione o email do novo admin
4. Salve o arquivo

### Estender Funcionalidades
Para adicionar novas seções ao painel:

1. Adicione item no menu (sidebar em `admin.html`)
2. Crie uma nova section com id `section-{nome}`
3. Adicione case no switch do método `showSection()` em `admin-panel.js`
4. Implemente o método de carregamento de dados

## Suporte

Para dúvidas ou problemas com o painel administrativo, entre em contato com a equipe de desenvolvimento.

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2025
