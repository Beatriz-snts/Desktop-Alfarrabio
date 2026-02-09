const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('fs');

async function run() {
    try {
        let dbPath;
        if (app) {
            // We might be running as "Electron" app, so app.getPath('userData') might be wrong if we want the production app data
            // The production app name is "Sebo Alfarrabio PDV"
            // Let's explicitly look for that folder in AppData
            const appData = process.env.APPDATA || (process.platform == 'win32' ? process.env.USERPROFILE + '\\AppData\\Roaming' : process.env.HOME + "/.local/share");
            dbPath = path.join(appData, 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');

            if (!fs.existsSync(dbPath)) {
                console.log(`DB not found at ${dbPath}, trying default electron path`);
                await app.whenReady();
                dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
            }
        } else {
            // Fallback
            const home = process.env.APPDATA || (process.platform == 'win32' ? process.env.USERPROFILE + '\\AppData\\Roaming' : process.env.HOME + "/.local/share");
            dbPath = path.join(home, 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');
        }

        console.log('Target DB Path:', dbPath);

        if (!fs.existsSync(dbPath)) {
            throw new Error(`Database file not found at ${dbPath}`);
        }

        const db = new Database(dbPath);
        const result = {
            dbPath,
            refs: [],
            schema: null,
            duplicates: []
        };

        const refs = db.prepare("SELECT name, sql FROM sqlite_master WHERE sql LIKE '%REFERENCES autores%'").all();
        result.refs = refs;

        const schema = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'autores'").get();
        result.schema = schema ? schema.sql : null;

        const duplicates = db.prepare(`
            SELECT TRIM(nome) as nome_limpo, COUNT(*) as qtd, GROUP_CONCAT(id) as ids 
            FROM autores 
            WHERE excluido_em IS NULL
            GROUP BY TRIM(nome) COLLATE NOCASE 
            HAVING qtd > 1
        `).all();
        result.duplicates = duplicates;

        fs.writeFileSync('refs.json', JSON.stringify(result, null, 2));

        if (app) app.quit();
    } catch (e) {
        console.error(e);
        fs.writeFileSync('refs_error.json', JSON.stringify({ error: e.message, stack: e.stack }));
        if (app) app.quit();
        process.exit(1);
    }
}

run();
