const fs = require('fs');
const path = require('node:path');

const appData = process.env.APPDATA || (process.platform == 'win32' ? process.env.USERPROFILE + '\\AppData\\Roaming' : process.env.HOME + "/.local/share");
const sourcePath = path.join(appData, 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');
const destPath = path.join(__dirname, 'sebo-alfarrabio-backup.db');

console.log(`Source: ${sourcePath}`);
console.log(`Destination: ${destPath}`);

try {
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log('Database copied successfully!');
    } else {
        console.error('Source database not found!');
        // Try fallback
        const fallbackPath = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');
        if (fs.existsSync(fallbackPath)) {
            console.log(`Trying fallback: ${fallbackPath}`);
            fs.copyFileSync(fallbackPath, destPath);
            console.log('Database copied successfully from fallback!');
        } else {
            console.error('Could not find database file.');
        }
    }
} catch (e) {
    console.error('Error copying database:', e);
}
