// Serviço de Sincronização - Sebo Alfarrabio PDV
// Sincroniza dados entre o SQLite local e o MySQL remoto via API PHP

import db from '../Database/db.js';
import { SyncConfig } from '../Database/SyncConfig.js';

class SyncService {
    constructor() {
        this.ultimoSync = null;
        this.emAndamento = false;
    }

    // ==================== MÉTODOS DE CONEXÃO ====================

    async testarConexao() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.categorias}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return { success: true, message: 'Conexão estabelecida com sucesso', data };
        } catch (error) {
            return { success: false, message: `Erro de conexão: ${error.message}` };
        }
    }

    // ==================== IMPORTAÇÃO (Remoto → Local) ====================

    async importarCategorias() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.categorias}`);
            const result = await response.json();

            const categorias = result.data || result;
            const mapping = SyncConfig.FIELD_MAPPING.categorias;

            let importados = 0;
            const stmt = db.prepare(`
                INSERT OR REPLACE INTO categorias (remote_id, nome, sync_status, atualizado_em)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            `);

            for (const cat of categorias) {
                stmt.run(
                    cat[Object.keys(mapping).find(k => mapping[k] === 'remote_id')],
                    cat[Object.keys(mapping).find(k => mapping[k] === 'nome')]
                );
                importados++;
            }

            return { success: true, importados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async importarGeneros() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.generos}`);
            const result = await response.json();

            const generos = result.data || result;
            let importados = 0;

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO generos (remote_id, nome, sync_status, atualizado_em)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            `);

            for (const gen of generos) {
                stmt.run(gen.id_generos, gen.nome_generos);
                importados++;
            }

            return { success: true, importados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async importarAutores() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.autores}`);
            const result = await response.json();

            const autores = result.data || result;
            let importados = 0;

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO autores (remote_id, nome, biografia, sync_status, atualizado_em)
                VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            `);

            for (const autor of autores) {
                stmt.run(autor.id_autor, autor.nome_autor, autor.biografia || null);
                importados++;
            }

            return { success: true, importados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async importarItens() {
        try {
            // Buscar itens paginados
            let pagina = 1;
            let importados = 0;
            let temMais = true;

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO itens 
                (uuid, remote_id, nome, autor, editora, isbn, descricao, preco, categoria_id, genero_id, imagem_path, estoque, sync_status, atualizado_em)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            `);

            while (temMais) {
                const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.itens}?pagina=${pagina}&por_pagina=50`);
                const result = await response.json();

                const itens = result.data || [];

                if (itens.length === 0) {
                    temMais = false;
                    break;
                }

                for (const item of itens) {
                    // Gerar UUID local se não existir
                    const uuid = this.gerarUUID();

                    // Buscar categoria_id local pelo remote_id
                    const catLocal = db.prepare('SELECT id FROM categorias WHERE remote_id = ?').get(item.id_categoria);
                    const genLocal = db.prepare('SELECT id FROM generos WHERE remote_id = ?').get(item.id_genero);

                    stmt.run(
                        uuid,
                        item.id_item,
                        item.titulo_item || item.titulo,
                        item.autores || null, // Autores concatenados
                        item.editora_gravadora || item.editora || null,
                        item.isbn || null,
                        item.descricao || null,
                        item.preco_item || item.preco,
                        catLocal?.id || null,
                        genLocal?.id || null,
                        item.foto_item || item.imagem || null,
                        item.estoque || 0
                    );
                    importados++;
                }

                pagina++;

                // Verificar se tem mais páginas
                if (result.ultima_pagina && pagina > result.ultima_pagina) {
                    temMais = false;
                }
            }

            return { success: true, importados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== EXPORTAÇÃO (Local → Remoto) ====================

    async exportarVendas() {
        try {
            // Buscar vendas não sincronizadas
            const vendas = db.prepare(`
                SELECT v.*, u.nome as vendedor_nome
                FROM vendas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                WHERE v.sync_status = 0 AND v.status = 'concluida'
            `).all();

            let exportados = 0;

            for (const venda of vendas) {
                // Buscar itens da venda
                const itensVenda = db.prepare(`
                    SELECT iv.*, i.remote_id as item_remote_id
                    FROM itens_venda iv
                    JOIN itens i ON iv.item_id = i.id
                    WHERE iv.venda_id = ?
                `).all(venda.id);

                // Montar payload
                const payload = {
                    venda: {
                        uuid: venda.uuid,
                        data_venda: venda.data_venda,
                        subtotal: venda.subtotal,
                        desconto: venda.desconto,
                        total: venda.total,
                        forma_pagamento: venda.forma_pagamento,
                        vendedor: venda.vendedor_nome
                    },
                    itens: itensVenda.map(iv => ({
                        item_id: iv.item_remote_id,
                        quantidade: iv.quantidade,
                        preco_unitario: iv.preco_unitario
                    }))
                };

                // Enviar para API
                const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.vendas}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    // Marcar como sincronizada
                    db.prepare('UPDATE vendas SET sync_status = 1 WHERE id = ?').run(venda.id);
                    exportados++;
                }
            }

            return { success: true, exportados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ==================== SYNC COMPLETO ====================

    async sincronizarTudo() {
        if (this.emAndamento) {
            return { success: false, message: 'Sincronização já em andamento' };
        }

        this.emAndamento = true;
        const resultados = {};

        try {
            // Testar conexão primeiro
            const conexao = await this.testarConexao();
            if (!conexao.success) {
                this.emAndamento = false;
                return { success: false, message: conexao.message };
            }

            // Importar na ordem correta (dependências primeiro)
            resultados.categorias = await this.importarCategorias();
            resultados.generos = await this.importarGeneros();
            resultados.autores = await this.importarAutores();
            resultados.itens = await this.importarItens();

            // Exportar vendas locais
            resultados.vendas = await this.exportarVendas();

            // Atualizar timestamp
            this.ultimoSync = new Date().toISOString();
            db.prepare(`
                INSERT OR REPLACE INTO configuracoes (chave, valor, atualizado_em)
                VALUES ('ultimo_sync', ?, CURRENT_TIMESTAMP)
            `).run(this.ultimoSync);

            this.emAndamento = false;

            return {
                success: true,
                message: 'Sincronização concluída',
                resultados,
                ultimoSync: this.ultimoSync
            };
        } catch (error) {
            this.emAndamento = false;
            return { success: false, error: error.message };
        }
    }

    // ==================== UTILITÁRIOS ====================

    gerarUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getUltimoSync() {
        const config = db.prepare('SELECT valor FROM configuracoes WHERE chave = ?').get('ultimo_sync');
        return config?.valor || null;
    }

    getStatusSync() {
        return {
            emAndamento: this.emAndamento,
            ultimoSync: this.getUltimoSync()
        };
    }
}

export default new SyncService();
