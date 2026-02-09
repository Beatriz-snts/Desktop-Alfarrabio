import { app } from 'electron';
import Database from 'better-sqlite3';
import path from 'node:path';

async function verify() {
    try {
        await app.whenReady();
        const dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
        const db = new Database(dbPath);

        const autores = db.prepare('SELECT remote_id, nome FROM autores WHERE remote_id IS NOT NULL LIMIT 10').all();
        console.log('\n--- AUTORES NO BANCO LOCAL ---');
        if (autores.length === 0) {
            console.log('Nenhum autor encontrado com remote_id.');
        } else {
            autores.forEach(a => {
                console.log(`ID Remoto: ${a.remote_id} | Nome: ${a.nome}`);
            });
        }

        process.exit(0);
    } catch (e) {
        console.error('Erro na verificação:', e);
        process.exit(1);
    }
}

verify();
