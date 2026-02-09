import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'node:path';

async function verify() {
    try {
        await app.whenReady();
        const dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
        const db = new Database(dbPath);

        const count = db.prepare('SELECT COUNT(*) as count FROM autores').get();
        console.log(`\nTotal de autores na tabela: ${count.count}`);

        if (count.count > 0) {
            const amostra = db.prepare('SELECT * FROM autores LIMIT 10').all();
            console.log('\n--- AMOSTRA DE AUTORES ---');
            console.table(amostra);
        }

        process.exit(0);
    } catch (e) {
        console.error('Erro na verificação:', e);
        process.exit(1);
    }
}

verify();
