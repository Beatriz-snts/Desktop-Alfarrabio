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
                console.log(`DB não encontrado em ${dbPath}, tentando caminho padrão do electron...`);
                await app.whenReady();
                dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
            }
        } else {
            const home = process.env.APPDATA || (process.platform == 'win32' ? process.env.USERPROFILE + '\\AppData\\Roaming' : process.env.HOME + "/.local/share");
            dbPath = path.join(home, 'Sebo Alfarrabio PDV', 'sebo-alfarrabio.db');
        }

        console.log('Abrindo Banco de Dados em:', dbPath);

        if (!fs.existsSync(dbPath)) {
            throw new Error(`Arquivo do banco de dados não encontrado em ${dbPath}`);
        }

        const db = new Database(dbPath);

        // 1. Encontrar duplicatas
        console.log('Buscando duplicatas...');
        const rows = db.prepare(`
            SELECT id, nome, remote_id 
            FROM autores 
            WHERE excluido_em IS NULL
            ORDER BY id ASC
        `).all();

        const map = new Map();
        rows.forEach(r => {
            const normalized = r.nome.trim().toLowerCase();
            if (!map.has(normalized)) {
                map.set(normalized, []);
            }
            map.get(normalized).push(r);
        });

        let autoresRemovidos = 0;
        let referenciasAtualizadas = 0;

        const gruposDuplicados = Array.from(map.values()).filter(g => g.length > 1);
        console.log(`Encontrados ${gruposDuplicados.length} grupos de autores duplicados.`);

        db.transaction(() => {
            for (const grupo of gruposDuplicados) {
                // Manter o primeiro (menor ID)
                const principal = grupo[0];
                const duplicatas = grupo.slice(1);

                console.log(`\nProcessando: "${principal.nome}" (ID Principal: ${principal.id})`);

                for (const dup of duplicatas) {
                    // Atualizar referências em item_autores
                    // Verificar se o item já tem o autor principal
                    const itensDoDuplicado = db.prepare('SELECT item_id FROM item_autores WHERE autor_id = ?').all(dup.id);

                    for (const itemRef of itensDoDuplicado) {
                        const jaTemPrincipal = db.prepare('SELECT 1 FROM item_autores WHERE item_id = ? AND autor_id = ?').get(itemRef.item_id, principal.id);

                        if (jaTemPrincipal) {
                            // Se já tem o principal, apenas removemos a ligação com o duplicado para não gerar erro de unique (se houvesse) ou dados redundantes
                            db.prepare('DELETE FROM item_autores WHERE item_id = ? AND autor_id = ?').run(itemRef.item_id, dup.id);
                            // console.log(`  - Removida ligação redundante item ${itemRef.item_id} -> autor ${dup.id}`);
                        } else {
                            // Se não tem, atualizamos para apontar para o principal
                            db.prepare('UPDATE item_autores SET autor_id = ? WHERE item_id = ? AND autor_id = ?').run(principal.id, itemRef.item_id, dup.id);
                            referenciasAtualizadas++;
                            // console.log(`  - Atualizada ligação item ${itemRef.item_id}: autor ${dup.id} -> ${principal.id}`);
                        }
                    }

                    // Soft delete do autor duplicado
                    db.prepare('UPDATE autores SET excluido_em = CURRENT_TIMESTAMP WHERE id = ?').run(dup.id);
                    autoresRemovidos++;
                }
            }
        })();

        console.log('\n--- Resumo ---');
        console.log(`Autores removidos (soft delete): ${autoresRemovidos}`);
        console.log(`Referências em item_autores corrigidas: ${referenciasAtualizadas}`);

        if (app) app.quit();
    } catch (e) {
        console.error('Erro:', e);
        if (app) app.quit();
        process.exit(1);
    }
}

run();
