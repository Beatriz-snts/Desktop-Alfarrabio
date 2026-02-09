import { SyncConfig } from './src/Main_back/Database/SyncConfig.js';

async function debugApi() {
    try {
        console.log(`Fetching: ${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.autores}`);
        const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.autores}`);
        const result = await response.json();

        console.log('\n--- RESPOSTA DA API (AUTORES) ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.data) {
            console.log(`\nTotal de itens em 'data': ${result.data.length}`);
            if (result.data.length > 0) {
                console.log('Primeiro item:', JSON.stringify(result.data[0], null, 2));
            }
        } else {
            console.log('\nA resposta não contém a chave "data".');
        }

        process.exit(0);
    } catch (e) {
        console.error('Erro na depuração da API:', e);
        process.exit(1);
    }
}

debugApi();
