
// Simplified test that only tests the API part
const API_BASE_URL = 'https://seboalfarrabio.com.br/backend/api';
const endpoint = '/api/item/salvar';

async function testApiOnly() {
    console.log('🚀 Starting API-only Test...');

    const payload = {
        titulo_item: 'Livro Teste API ' + Date.now(),
        preco_item: 42.50,
        descricao: 'Teste de integração via script externo',
        estoque: 10,
        id_categoria: 1,
        id_genero: 1,
        autores_ids: []
    };

    try {
        console.log('📡 Sending to:', API_BASE_URL + endpoint);
        const response = await fetch(API_BASE_URL + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SeboAlfarrabioPDV/1.0'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('📥 API Response:', result);

        if (result.status === 'success') {
            console.log('✅ API is working correctly!');
            console.log('ID do item cadastrado:', result.id_item);
        } else {
            console.error('❌ API returned error:', result.message);
        }
    } catch (error) {
        console.error('💥 Fetch Error:', error.message);
    }
}

testApiOnly();
