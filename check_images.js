const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('fs');

async function run() {
    try {
        let dbPath;
        if (app) {
            const appData = process.env.APPDATA || (process.platform == 'win32' ? process.env.USERPROFILE + '\\AppData\\Roaming' : process.env.HOME + "/.local/share");
            dbPath = path.join(appData, 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');

            if (!fs.existsSync(dbPath)) {
                console.log(`DB não encontrado em ${dbPath}, tentando caminho padrão...`);
                await app.whenReady();
                dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
            }
        } else {
            const home = process.env.APPDATA || (process.platform == 'win32' ? process.env.USERPROFILE + '\\AppData\\Roaming' : process.env.HOME + "/.local/share");
            dbPath = path.join(home, 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');
        }

        console.log('DB Path:', dbPath);
        const db = new Database(dbPath);

        const itens = db.prepare("SELECT uuid, nome, imagem_path FROM itens WHERE imagem_path IS NOT NULL LIMIT 5").all();

        console.log('\n--- Amostra de Itens com Imagem ---');
        itens.forEach(i => {
            console.log(`\nItem: ${i.nome}`);
            console.log(`Path no Banco: ${i.imagem_path}`);
            try {
                const exists = fs.existsSync(i.imagem_path);
                console.log(`Arquivo existe? ${exists ? 'SIM' : 'NÃO'}`);
            } catch (e) {
                console.log(`Erro ao verificar arquivo: ${e.message}`);
            }
        });

        if (app) app.quit();
    } catch (e) {
        console.error(e);
        if (app) app.quit();
        process.exit(1);
    }
}

run();
