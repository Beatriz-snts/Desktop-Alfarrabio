const { app } = require('electron');
const path = require('path');

async function runSync() {
    try {
        console.log('--- Iniciando Sincronização via Electron ---');

        // Mock app.getPath if needed or wait for app ready
        await app.whenReady();

        // Importar DB e inicializar
        const { initDatabase } = require('./src/Main_back/Database/db.js');
        initDatabase();

        // Importar SyncService
        const SyncService = require('./src/Main_back/Services/SyncService.js').default;

        console.log('Iniciando sync completo...');
        const result = await SyncService.sincronizarTudo();

        if (result.success) {
            console.log('✅ Sincronização concluída com sucesso!');
            console.log('Resultados:', JSON.stringify(result.resultados, null, 2));
            console.log('Último Sync:', result.ultimoSync);
        } else {
            console.error('❌ Falha na sincronização:', result.message || result.error);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    }
}

runSync();
