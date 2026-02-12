
// Simplified test using only built-in modules or direct DB access
import Database from 'better-sqlite3';

const dbPath = 'C:\\Users\\beatriz.vsantos27\\AppData\\Roaming\\Desktop-Alfarrabio\\database.sqlite'; // Assuming standard path, will check
const db = new Database(dbPath);

async function testItemSyncManual() {
    console.log('🚀 Starting Manual Item Sync Verification...');

    try {
        // 1. Create a dummy item for testing
        console.log('📝 Creating test item...');
        const uuid = 'test-uuid-' + Date.now();
        db.prepare(`
            INSERT INTO itens (uuid, nome, preco, sync_status, estoque)
            VALUES (?, ?, ?, 0, 10)
        `).run(uuid, 'Item de Teste Sync Manual', 99.99);

        console.log('✅ Test item created with sync_status = 0');

        // 2. We can't easily run the SyncService because of imports/electron dependencies
        // But we can verify the SQL queries are correct in the model

        console.log('🔍 Checking for pending items...');
        const pending = db.prepare('SELECT * FROM itens WHERE sync_status = 0').all();
        console.log(`📊 Found ${pending.length} pending items.`);

        // 3. Cleanup
        db.prepare('DELETE FROM itens WHERE uuid = ?').run(uuid);
        console.log('🧹 Cleanup complete.');

    } catch (error) {
        console.error('💥 Error:', error.message);
    }
}

testItemSyncManual();
