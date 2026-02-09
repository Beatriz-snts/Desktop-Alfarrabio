import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'node:path';

async function testAutores() {
    try {
        await app.whenReady();
        const SyncService = (await import('./src/Main_back/Services/SyncService.js')).default;

        console.log('--- TESTANDO IMPORTAÇÃO DE AUTORES ---');
        const result = await SyncService.importarAutores();

        console.log('Resultado:', JSON.stringify(result, null, 2));

        // Se houver erro, logar o banco local para ver se tem algo
        const dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
        const db = new Database(dbPath);
        const count = db.prepare('SELECT COUNT(*) as count FROM autores').get();
        console.log(`\nTotal no banco local agora: ${count.count}`);

        process.exit(0);
    } catch (e) {
        console.error('Erro no teste:', e);
        process.exit(1);
    }
}

testAutores();
