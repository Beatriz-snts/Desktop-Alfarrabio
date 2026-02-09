const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('node:path');

// Mock app.getPath if not running in Electron
if (!app) {
    console.log('Not running in Electron, assuming default path for dev');
    // Adjust this path if needed for your local dev environment
    // For now, let's try to find the db relative to where we are or use a hardcoded path if we know it
    // But since we are in the root, and we know from verify-autores.js it uses app.getPath('userData')
    // We might need to guess where that is or just use the one in the project if it exists.
    // However, the user data is usually in AppData.
    // Let's try to just use the one in the current directory if it exists, or look for it.
    // Actually, I'll use a hardcoded path for now based on typical Windows Electron paths if I can't use app.
}

async function run() {
    try {
        let dbPath;
        if (app) {
            await app.whenReady();
            dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
        } else {
            // Fallback for node execution without electron
            // try to find it in default location
            const home = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
            dbPath = path.join(home, 'sebo-alfarrabio-pdv', 'sebo-alfarrabio.db');
            console.log('Guessing DB path:', dbPath);
        }

        console.log('Opening DB at:', dbPath);
        const db = new Database(dbPath);

        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log('Tables:', tables.map(t => t.name));

        tables.forEach(t => {
            console.log(`\nSchema for ${t.name}:`);
            const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE name = ?`).get(t.name);
            console.log(schema.sql);
        });

        if (app) app.quit();
    } catch (e) {
        console.error(e);
        if (app) app.quit();
        process.exit(1);
    }
}

run();
