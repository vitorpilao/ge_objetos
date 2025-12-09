// 🧪 Script de Teste dos Endpoints Admin
// Execute este código no console do navegador (F12) quando estiver logado como admin

console.log('🧪 Iniciando testes dos endpoints admin...\n');

// Configuração
const API_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:CvN5Ncxn';
const authToken = AuthManager.getAuthToken();

if (!authToken) {
    console.error('❌ Erro: Usuário não está autenticado!');
    console.log('➡️ Faça login primeiro');
} else {
    console.log('✅ Token encontrado');
    testEndpoints();
}

async function testEndpoints() {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };

    // Teste 1: GET /admin/stats
    console.log('\n📊 Teste 1: GET /admin/stats');
    try {
        const res1 = await fetch(`${API_BASE_URL}/admin/stats`, { headers });
        if (res1.ok) {
            const stats = await res1.json();
            console.log('✅ Estatísticas:', stats);
        } else {
            console.log('⚠️ Status:', res1.status, res1.statusText);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    // Teste 2: GET /admin/users
    console.log('\n👥 Teste 2: GET /admin/users');
    try {
        const res2 = await fetch(`${API_BASE_URL}/admin/users`, { headers });
        if (res2.ok) {
            const data = await res2.json();
            // A API pode retornar array direto ou objeto com propriedade users
            const users = Array.isArray(data) ? data : (data.users || data.content || []);
            console.log('✅ Usuários encontrados:', users.length);
            console.log('📋 Lista:', users);
        } else {
            console.log('⚠️ Status:', res2.status, res2.statusText);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }

    // Teste 3: POST /admin/users (criar usuário teste)
    console.log('\n➕ Teste 3: POST /admin/users (criar usuário)');
    const testUser = {
        name: 'Teste API',
        email: `teste_${Date.now()}@impacta.com`,
        password: 'senha123',
        role: 'member',
        is_active: true
    };
    
    try {
        const res3 = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testUser)
        });
        
        if (res3.ok) {
            const newUser = await res3.json();
            console.log('✅ Usuário criado:', newUser);
            
            // Se o endpoint não retornou o ID, buscar o usuário na lista
            let userId = newUser.id;
            
            if (!userId) {
                console.log('⚠️ ID não retornado na criação, buscando usuário na lista...');
                const res2b = await fetch(`${API_BASE_URL}/admin/users`, { headers });
                if (res2b.ok) {
                    const users = await res2b.json();
                    const userList = Array.isArray(users) ? users : (users.users || []);
                    const foundUser = userList.find(u => u.email === testUser.email);
                    if (foundUser) {
                        userId = foundUser.id;
                        console.log('✅ Usuário encontrado com ID:', userId);
                    } else {
                        console.log('❌ Não foi possível encontrar o usuário criado');
                        console.log('⏭️ Pulando testes 4, 5 e 6');
                    }
                }
            }
            
            // Guardar ID para próximos testes
            window.testUserId = userId;
            
            if (userId) {
                // Teste 4: GET /admin/users/{id}
                console.log('\n👤 Teste 4: GET /admin/users/' + userId);
                const res4 = await fetch(`${API_BASE_URL}/admin/users/${userId}`, { headers });
                if (res4.ok) {
                    const user = await res4.json();
                    console.log('✅ Detalhes do usuário:', user);
                } else {
                    console.log('⚠️ Status:', res4.status, res4.statusText);
                }
                
                // Teste 5: PATCH /admin/users/{id}
                console.log('\n✏️ Teste 5: PATCH /admin/users/' + userId);
                const updates = {
                    name: 'Teste API Atualizado',
                    role: 'member'
                };
                const res5 = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(updates)
                });
                if (res5.ok) {
                    const updated = await res5.json();
                    console.log('✅ Usuário atualizado:', updated);
                } else {
                    console.log('⚠️ Status:', res5.status, res5.statusText);
                }
                
                // Teste 6: DELETE /admin/users/{id} (soft delete)
                console.log('\n🗑️ Teste 6: DELETE /admin/users/' + userId + ' (soft delete)');
                const res6 = await fetch(`${API_BASE_URL}/admin/users/${userId}?soft_delete=true`, {
                    method: 'DELETE',
                    headers
                });
                if (res6.ok) {
                    const result = await res6.json();
                    console.log('✅ Usuário desativado:', result);
                } else {
                    console.log('⚠️ Status:', res6.status, res6.statusText);
                }
            }
            
        } else {
            const error = await res3.json();
            console.log('⚠️ Erro ao criar:', error);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
    
    console.log('\n✅ Testes concluídos!');
    console.log('📝 Verifique os resultados acima');
}
