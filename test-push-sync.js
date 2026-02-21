
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = 'C:\\Users\\beatriz.vsantos27\\AppData\\Roaming\\Desktop-Alfarrabio\\database.sqlite';
const db = new Database(dbPath);

async function testPushSync() {
    console.log('🚀 Starting Push Sync Verification...');

    try {
        // 1. Create a dummy item for testing
        const uuid = 'test-sync-' + Date.now();
        console.log(`📝 Creating test item ${uuid}...`);
        db.prepare(`
            INSERT INTO itens (uuid, nome, preco, sync_status, estoque, descricao)
            VALUES (?, ?, ?, 0, 5, ?)
        `).run(uuid, 'Livro Teste Sincronização AI', 45.90, 'Descrição do livro de teste para sync');

        console.log('✅ Test item created locally.');

        // 2. Mock the sync process (Manual implementation since we can't easily import SyncService in this environment)
        console.log('🔍 Fetching pending items...');
        const item = db.prepare('SELECT * FROM itens WHERE uuid = ?').get(uuid);

        if (!item) throw new Error('Item not found after creation!');

        // Configuration
        const API_BASE_URL = 'https://seboalfarrabio.com.br/backend/api';
        const endpoint = '/api/item/salvar';

        const payload = {
            titulo_item: item.nome,
            preco_item: item.preco,
            descricao: item.descricao,
            estoque: item.estoque,
            id_categoria: item.categoria_id || 1, // Defaulting for test
            id_genero: item.genero_id || 1,
            autores_ids: []
        };

        console.log('📡 Sending to API...', API_BASE_URL + endpoint);

        const response = await fetch(API_BASE_URL + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SeboAlfarrabioPDV/1.0'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('📥 API Response:', result);

            if (result.status === 'success') {
                const remoteId = result.id_item || result.id;
                console.log(`✅ Sync successful! Remote ID: ${remoteId}`);

                // Update local status
                db.prepare('UPDATE itens SET remote_id = ?, sync_status = 1 WHERE uuid = ?').run(remoteId, uuid);
                console.log('💾 Local record updated.');
            } else {
                console.error('❌ API Error:', result.message);
            }
        } else {
            console.error(`❌ HTTP Error: ${response.status}`);
            const text = await response.text();
            console.error('Response body:', text);
        }

        // 3. Cleanup (optional - comment out if you want to see the item in the site)
        // db.prepare('DELETE FROM itens WHERE uuid = ?').run(uuid);
        // console.log('🧹 Cleanup complete.');

    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        db.close();
    }
}

testPushSync();
