// Serviço de Sincronização - Sebo Alfarrabio PDV
// Sincroniza dados entre o SQLite local e o MySQL remoto via API PHP

import db from '../Database/db.js';
import { SyncConfig } from '../Database/SyncConfig.js';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

class SyncService {
    constructor() {
        this.ultimoSync = null;
        this.emAndamento = false;
        this.syncTimer = null;
    }

    // ==================== MÉTODOS DE CONEXÃO ====================

    async testarConexao() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.categorias}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SeboAlfarrabioPDV/1.0'
                },
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
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.categorias}`, {
                headers: {
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Accept': 'application/json'
                }
            });
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
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.generos}`, {
                headers: {
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Accept': 'application/json'
                }
            });
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

    async importarAvaliacoes() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.avaliacoes}`, {
                headers: {
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Accept': 'application/json'
                }
            });
            const result = await response.json();

            const avaliacoes = result.avaliacoes || [];
            let importados = 0;

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO avaliacoes 
                (remote_id, nota, comentario, data_iso, usuario_id, usuario_nome, usuario_foto, item_remote_id, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `);

            for (const av of avaliacoes) {
                stmt.run(
                    av.id,
                    av.nota,
                    av.comentario || null,
                    av.data_iso || null,
                    av.usuario?.id || null,
                    av.usuario?.nome || null,
                    av.usuario?.foto || null,
                    av.item?.id || null
                );
                importados++;
            }

            return { success: true, importados };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async importarAutores() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.autores}`, {
                headers: {
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Accept': 'application/json'
                }
            });
            const result = await response.json();

            const autores = result.data || result;
            let importados = 0;

            const stmt = db.prepare(`
                INSERT OR REPLACE INTO autores (remote_id, nome, sync_status, atualizado_em)
                VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            `);

            for (const autor of autores) {
                stmt.run(autor.id_autor, autor.nome_autor);
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
                (uuid, remote_id, nome, autor, editora, isbn, descricao, preco, preco_item, tipo, ano_publicacao, duracao_minutos, numero_edicao, imagem_path, estoque, sync_status, atualizado_em)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
            `);

            while (temMais) {
                const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.itens}?pagina=${pagina}&por_pagina=50`, {
                    headers: {
                        'User-Agent': 'SeboAlfarrabioPDV/1.0',
                        'Accept': 'application/json'
                    }
                });
                const result = await response.json();

                const itens = result.data || [];

                if (itens.length === 0) {
                    temMais = false;
                    break;
                }

                for (const item of itens) {
                    // Buscar UUID local se já existir pelo remote_id para evitar duplicatas
                    const itemExistente = db.prepare('SELECT uuid, imagem_path, sync_status FROM itens WHERE remote_id = ?').get(item.id_item);

                    // Se o item existe localmente e tem alterações pendentes (sync_status = 0), não sobrescrever
                    if (itemExistente && itemExistente.sync_status === 0) {
                        console.log(`⚠️ Item ${item.id_item} tem alterações locais pendentes. Pulando importação.`);
                        continue;
                    }

                    const uuid = itemExistente ? itemExistente.uuid : this.gerarUUID();

                    // Lógica de download de imagem
                    let localImagePath = itemExistente?.imagem_path || null;

                    // Priorizar imagem_base64 se enviada pela API
                    if (item.imagem_base64) {
                        const fileName = item.foto_item ? path.basename(item.foto_item) : `item_${item.id_item}.jpg`;
                        const res = this.salvarBase64ComoArquivo(item.imagem_base64, fileName);
                        if (res.success) {
                            localImagePath = res.path;
                        }
                    }
                    // Fallback para download via URL se houver foto_item e não tiver base64
                    else if (item.foto_item) {
                        const imageFileName = path.basename(item.foto_item);
                        const downloadResult = await this.baixarImagem(item.foto_item, imageFileName);
                        if (downloadResult.success) {
                            localImagePath = downloadResult.path;
                        }
                    }

                    stmt.run(
                        uuid,
                        item.id_item,
                        item.titulo,
                        Array.isArray(item.autores) ? item.autores.join(', ') : (item.autores || null),
                        item.editora || null,
                        item.isbn || null,
                        item.descricao || null,
                        item.preco || 0,
                        item.preco_item || 0,
                        item.tipo || null,
                        item.ano_publicacao || null,
                        item.duracao_minutos || null,
                        item.numero_edicao || null,
                        localImagePath,
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
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'SeboAlfarrabioPDV/1.0'
                    },
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

    async exportarItens() {
        try {
            // Buscar itens modificados localmente
            const itens = db.prepare('SELECT * FROM itens WHERE sync_status = 0').all();
            let exportados = 0;

            for (const item of itens) {
                // Montar payload conforme FIELD_MAPPING (Inverso: Local -> Remote)
                // Nota: O endpoint de categorias/gêneros deve ignorar IDs locais se não existirem no remoto
                const payload = {
                    id_item: item.remote_id || null,
                    titulo: item.nome,
                    preco: item.preco,
                    descricao: item.descricao,
                    isbn: item.isbn,
                    editora: item.editora,
                    estoque: item.estoque,
                    id_categoria: item.categoria_id,
                    id_genero: item.genero_id,
                    autores: item.autor ? item.autor.split(',').map(a => a.trim()) : []
                };

                // Adicionar imagem: se já é Base64, enviar diretamente; se é caminho de arquivo, converter
                if (item.imagem_path) {
                    if (item.imagem_path.startsWith('data:image/')) {
                        // Já é base64 data URI — enviar diretamente
                        payload.imagem_base64 = item.imagem_path;
                        payload.foto_item = `item_${item.uuid}.jpg`;
                    } else if (item.imagem_path.startsWith('media:///')) {
                        // Caminho de arquivo legado — converter para base64
                        try {
                            let localPath = item.imagem_path.replace('media:///', '');
                            // Normaliza para o SO atual (C:\...)
                            localPath = path.resolve(localPath);

                            if (fs.existsSync(localPath)) {
                                const fileBuffer = fs.readFileSync(localPath);
                                const base64Image = fileBuffer.toString('base64');
                                const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpg';
                                const mime = ext === 'png' ? 'png' : (ext === 'webp' ? 'webp' : 'jpeg');

                                payload.imagem_base64 = `data:image/${mime};base64,${base64Image}`;
                                payload.foto_item = path.basename(localPath);
                            }
                        } catch (err) {
                            console.error(`Erro ao converter imagem do item ${item.uuid} para Base64:`, err.message);
                        }
                    }
                }

                const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.itens}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'SeboAlfarrabioPDV/1.0'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    // Se for um item novo, salvar o remote_id retornado
                    if (!item.remote_id && result.id) {
                        db.prepare('UPDATE itens SET remote_id = ?, sync_status = 1 WHERE uuid = ?').run(result.id, item.uuid);
                    } else {
                        db.prepare('UPDATE itens SET sync_status = 1 WHERE uuid = ?').run(item.uuid);
                    }
                    exportados++;
                }
            }

            return { success: true, exportados };
        } catch (error) {
            console.error('Erro ao exportar itens:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== AUXILIARES DE IMAGEM ====================

    salvarBase64ComoArquivo(base64Data, fileName) {
        try {
            // Extrair dados base64 (removendo prefixo se houver: data:image/jpeg;base64,...)
            const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            let stringData = base64Data;

            if (matches && matches.length === 3) {
                stringData = matches[2];
            }

            const uploadDir = path.join(app.getPath('userData'), 'uploads', 'itens');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const localPath = path.join(uploadDir, fileName);
            const buffer = Buffer.from(stringData, 'base64');

            fs.writeFileSync(localPath, buffer);

            return { success: true, path: localPath };
        } catch (error) {
            console.error(`Erro ao salvar imagem base64 ${fileName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async baixarImagem(relativeUrl, fileName) {
        try {
            // URL Absoluta da imagem (ajustar conforme BASE_URL ou servidor de mídia)
            const baseUrl = SyncConfig.API_BASE_URL.replace('/index.php/api', '');
            const url = `${baseUrl}${relativeUrl}`;

            const uploadDir = path.join(app.getPath('userData'), 'uploads', 'itens');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const localPath = path.join(uploadDir, fileName);

            // Verificar se já existe para evitar download repetido
            if (fs.existsSync(localPath)) {
                return { success: true, path: localPath };
            }

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SeboAlfarrabioPDV/1.0'
                }
            });
            if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(localPath, buffer);

            return { success: true, path: localPath };
        } catch (error) {
            console.error(`Erro ao baixar imagem ${fileName}:`, error.message);
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
            resultados.avaliacoes = await this.importarAvaliacoes();

            // Exportar dados locais
            resultados.vendas = await this.exportarVendas();
            resultados.exportItens = await this.exportarItens();

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
            ultimoSync: this.getUltimoSync(),
            autoSyncAtivo: !!this.syncTimer
        };
    }

    // ==================== AUTO-SYNC ENGINE ====================

    iniciarAutoSync() {
        if (SyncConfig.AUTO_SYNC_INTERVAL <= 0) {
            console.log('🔄 Auto-sync desativado nas configurações.');
            return;
        }

        if (this.syncTimer) {
            console.log('🔄 Auto-sync já está rodando.');
            return;
        }

        console.log(`🚀 Auto-sync iniciado. Intervalo: ${SyncConfig.AUTO_SYNC_INTERVAL / 1000}s`);

        // Executar primeira vez após um pequeno delay para não sobrecarregar o boot
        setTimeout(() => this.sincronizarTudo(), 5000);

        this.syncTimer = setInterval(() => {
            console.log('🕒 Executando sincronização automática de rotina...');
            this.sincronizarTudo();
        }, SyncConfig.AUTO_SYNC_INTERVAL);
    }

    pararAutoSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('🛑 Auto-sync parado.');
        }
    }
}

export default new SyncService();
