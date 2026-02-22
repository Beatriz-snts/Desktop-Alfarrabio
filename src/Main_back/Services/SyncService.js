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

    // ==================== LOGGING ====================

    registrarLog(tipo, entidade, registros, status = 'sucesso', mensagem = null) {
        try {
            db.prepare(`
                INSERT INTO sync_log (tipo, entidade, registros, status, mensagem)
                VALUES (?, ?, ?, ?, ?)
            `).run(tipo, entidade, registros, status, mensagem);
        } catch (e) {
            console.error('Erro ao registrar log de sync:', e.message);
        }
    }

    getSyncLogs(limite = 50) {
        try {
            return db.prepare(
                'SELECT * FROM sync_log ORDER BY criado_em DESC LIMIT ?'
            ).all(limite);
        } catch (e) {
            return [];
        }
    }

    // ==================== FILA OFFLINE ====================

    enfileirar(operacao, entidade, payload) {
        try {
            db.prepare(`
                INSERT INTO sync_queue (operacao, entidade, payload)
                VALUES (?, ?, ?)
            `).run(operacao, entidade, JSON.stringify(payload));
            console.log(`📥 Operação enfileirada: ${operacao} ${entidade}`);
        } catch (e) {
            console.error('Erro ao enfileirar operação:', e.message);
        }
    }

    getFilaStatus() {
        try {
            const pendentes = db.prepare(
                "SELECT COUNT(*) as total FROM sync_queue WHERE status = 'pendente'"
            ).get();
            return { pendentes: pendentes?.total || 0 };
        } catch (e) {
            return { pendentes: 0 };
        }
    }

    async processarFila() {
        const itens = db.prepare(
            "SELECT * FROM sync_queue WHERE status = 'pendente' ORDER BY criado_em ASC LIMIT 50"
        ).all();

        let processados = 0;
        let falhas = 0;

        for (const item of itens) {
            try {
                const payload = JSON.parse(item.payload);
                let endpoint = '';

                switch (item.entidade) {
                    case 'vendas': endpoint = SyncConfig.ENDPOINTS.vendas_sync; break;
                    case 'categorias': endpoint = SyncConfig.ENDPOINTS.categorias_sync; break;
                    case 'generos': endpoint = SyncConfig.ENDPOINTS.generos_sync; break;
                    case 'autores': endpoint = SyncConfig.ENDPOINTS.autores_sync; break;
                    case 'itens':
                        endpoint = payload.id_item ? SyncConfig.ENDPOINTS.item_atualizar : SyncConfig.ENDPOINTS.item_salvar;
                        break;
                    default: continue;
                }

                const response = await fetch(`${SyncConfig.API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'SeboAlfarrabioPDV/1.0',
                        'Authorization': `Bearer ${SyncConfig.API_KEY}`
                    },
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
                });

                if (response.ok) {
                    db.prepare(
                        "UPDATE sync_queue SET status = 'processado', processado_em = CURRENT_TIMESTAMP WHERE id = ?"
                    ).run(item.id);
                    processados++;
                } else {
                    db.prepare(
                        "UPDATE sync_queue SET tentativas = tentativas + 1 WHERE id = ?"
                    ).run(item.id);
                    falhas++;
                }
            } catch (e) {
                db.prepare(
                    "UPDATE sync_queue SET tentativas = tentativas + 1 WHERE id = ?"
                ).run(item.id);
                falhas++;
            }
        }

        this.registrarLog('fila', 'queue', processados, falhas > 0 ? 'parcial' : 'sucesso',
            `Processados: ${processados}, Falhas: ${falhas}`);

        return { processados, falhas, restantes: itens.length - processados };
    }

    // ==================== MÉTODOS DE CONEXÃO ====================

    async testarConexao() {
        try {
            const response = await fetch(`${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.categorias}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
                const url = `${SyncConfig.API_BASE_URL.replace(/\/$/, '')}${SyncConfig.ENDPOINTS.vendas}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'SeboAlfarrabioPDV/1.0',
                        'Authorization': `Bearer ${SyncConfig.API_KEY}`
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
            let falhas = 0;

            if (itens.length > 0) {
                console.log(`🚀 Iniciando exportação de ${itens.length} itens...`);
                await this.registrarLog('export', 'itens', `Detectados ${itens.length} itens modificados para envio.`);
            }

            for (const item of itens) {
                try {
                    // Montar payload conforme esperado pelo PublicApiController do backend
                    const payload = {
                        id_item: item.remote_id || null,
                        titulo_item: item.nome,
                        preco_item: item.preco,
                        descricao: item.descricao,
                        isbn: item.isbn,
                        editora_gravadora: item.editora,
                        estoque: item.estoque,
                        id_categoria: item.categoria_id,
                        id_genero: item.genero_id,
                        autores_ids: item.autor_ids ? JSON.parse(item.autor_ids) : []
                    };

                    // Adicionar imagem
                    if (item.imagem_path) {
                        try {
                            if (item.imagem_path.startsWith('data:image/')) {
                                payload.imagem_base64 = item.imagem_path;
                                console.log(`📸 Item ${item.nome}: Usando imagem base64 já existente.`);
                            } else if (item.imagem_path.startsWith('media://')) {
                                let localPath = item.imagem_path.replace(/^media:\/\/+/i, '');
                                // Normalizar caminhos de volta (remover barra extra se necessário)
                                if (localPath.startsWith('/') && localPath.match(/^\/[a-zA-Z]:/)) {
                                    localPath = localPath.substring(1);
                                }
                                localPath = path.resolve(localPath);

                                if (fs.existsSync(localPath)) {
                                    const fileBuffer = fs.readFileSync(localPath);
                                    const base64Image = fileBuffer.toString('base64');
                                    const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpg';
                                    const mime = ext === 'png' ? 'png' : (ext === 'webp' ? 'webp' : 'jpeg');
                                    payload.imagem_base64 = `data:image/${mime};base64,${base64Image}`;
                                    console.log(`📸 Item ${item.nome}: Imagem convertida (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
                                } else {
                                    console.warn(`⚠️ Item ${item.nome}: Arquivo não encontrado em ${localPath}`);
                                    await this.registrarLog('export', 'itens', `Arquivo de imagem não encontrado para o item: ${item.nome}`, 'warning');
                                }
                            }
                        } catch (imgErr) {
                            console.error(`❌ Erro ao processar imagem do item ${item.nome}:`, imgErr.message);
                            await this.registrarLog('export', 'itens', `Erro na imagem do item ${item.nome}: ${imgErr.message}`, 'error');
                        }
                    }

                    // Escolher endpoint: se tem remote_id é atualização, senão é novo
                    const endpoint = item.remote_id ? SyncConfig.ENDPOINTS.item_atualizar : SyncConfig.ENDPOINTS.item_salvar;
                    const acao = item.remote_id ? 'Atualizando' : 'Cadastrando';

                    console.log(`📤 ${acao} item: ${item.nome}...`);

                    const response = await fetch(`${SyncConfig.API_BASE_URL}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'SeboAlfarrabioPDV/1.0',
                            'Authorization': `Bearer ${SyncConfig.API_KEY}`
                        },
                        body: JSON.stringify(payload),
                        signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.status === 'success') {
                            const remoteId = result.id_item || result.id;
                            if (!item.remote_id && remoteId) {
                                db.prepare('UPDATE itens SET remote_id = ?, sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE uuid = ?').run(remoteId, item.uuid);
                            } else {
                                db.prepare('UPDATE itens SET sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE uuid = ?').run(item.uuid);
                            }
                            exportados++;
                            console.log(`✅ Item sincronizado: ${item.nome} (ID Remoto: ${remoteId})`);
                        } else {
                            console.warn(`⚠️ Falha no sync do item ${item.nome}: ${result.message}`);
                            falhas++;
                        }
                    } else {
                        const errText = await response.text();
                        console.error(`❌ Erro HTTP ${response.status} ao sincronizar ${item.nome}: ${errText}`);
                        await this.registrarLog('export', 'itens', `Erro HTTP ${response.status} no item ${item.nome}`, 'error');
                        falhas++;
                    }
                } catch (itemErr) {
                    console.error(`❌ Erro fatal ao sincronizar item ${item.nome}:`, itemErr.message);
                    falhas++;
                }
            }

            if (exportados > 0 || falhas > 0) {
                await this.registrarLog('export', 'itens', `Sincronização de itens finalizada: ${exportados} sucessos, ${falhas} falhas.`);
            }

            return { success: true, exportados, falhas };
        } catch (error) {
            console.error('Erro ao exportar itens:', error);
            return { success: false, error: error.message };
        }
    }

    async exportarCategorias() {
        try {
            // Buscar categorias criadas localmente (sem remote_id, pendenters de sync)
            const categorias = db.prepare(`
                SELECT * FROM categorias
                WHERE sync_status = 0 AND remote_id IS NULL AND excluido_em IS NULL
            `).all();

            let exportados = 0;

            for (const cat of categorias) {
                const payload = {
                    nome_categoria: cat.nome,
                    descricao: cat.descricao || null
                };

                try {
                    const url = `${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.categorias_sync}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'SeboAlfarrabioPDV/1.0',
                            'Authorization': `Bearer ${SyncConfig.API_KEY}`
                        },
                        body: JSON.stringify(payload),
                        signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const remoteId = result.id || result.id_categoria || null;
                        if (remoteId) {
                            db.prepare('UPDATE categorias SET remote_id = ?, sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?')
                                .run(remoteId, cat.id);
                        } else {
                            db.prepare('UPDATE categorias SET sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?')
                                .run(cat.id);
                        }
                        exportados++;
                        console.log(`✅ Categoria exportada: ${cat.nome} (remote_id: ${remoteId})`);
                    } else {
                        const errText = await response.text();
                        console.warn(`⚠️ Falha ao exportar categoria "${cat.nome}": ${response.status} - ${errText}`);
                    }
                } catch (err) {
                    console.error(`❌ Erro ao exportar categoria "${cat.nome}": ${err.message}`);
                }
            }

            return { success: true, exportados };
        } catch (error) {
            console.error('Erro em exportarCategorias:', error);
            return { success: false, error: error.message };
        }
    }

    async exportarGeneros() {
        try {
            // Buscar gêneros criados localmente (sem remote_id, pendentes de sync)
            const generos = db.prepare(`
                SELECT g.*, c.remote_id as categoria_remote_id
                FROM generos g
                LEFT JOIN categorias c ON g.categoria_id = c.id
                WHERE g.sync_status = 0 AND g.remote_id IS NULL AND g.excluido_em IS NULL
            `).all();

            let exportados = 0;

            for (const gen of generos) {
                const payload = {
                    nome_generos: gen.nome,
                    id_categoria: gen.categoria_remote_id || null
                };

                try {
                    const url = `${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.generos_sync}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'SeboAlfarrabioPDV/1.0',
                            'Authorization': `Bearer ${SyncConfig.API_KEY}`
                        },
                        body: JSON.stringify(payload),
                        signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const remoteId = result.id || result.id_generos || null;
                        if (remoteId) {
                            db.prepare('UPDATE generos SET remote_id = ?, sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?')
                                .run(remoteId, gen.id);
                        } else {
                            db.prepare('UPDATE generos SET sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?')
                                .run(gen.id);
                        }
                        exportados++;
                        console.log(`✅ Gênero exportado: ${gen.nome} (remote_id: ${remoteId})`);
                    } else {
                        const errText = await response.text();
                        console.warn(`⚠️ Falha ao exportar gênero "${gen.nome}": ${response.status} - ${errText}`);
                    }
                } catch (err) {
                    console.error(`❌ Erro ao exportar gênero "${gen.nome}": ${err.message}`);
                }
            }

            return { success: true, exportados };
        } catch (error) {
            console.error('Erro em exportarGeneros:', error);
            return { success: false, error: error.message };
        }
    }

    async exportarAutores() {
        try {
            // Buscar autores criados localmente (sem remote_id, pendentes de sync)
            const autores = db.prepare(`
                SELECT * FROM autores
                WHERE sync_status = 0 AND remote_id IS NULL AND excluido_em IS NULL
            `).all();

            let exportados = 0;

            for (const autor of autores) {
                const payload = {
                    nome_autor: autor.nome,
                    biografia: autor.biografia || null
                };

                try {
                    const url = `${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.autores_sync}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'SeboAlfarrabioPDV/1.0',
                            'Authorization': `Bearer ${SyncConfig.API_KEY}`
                        },
                        body: JSON.stringify(payload),
                        signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        const remoteId = result.id || result.id_autor || null;
                        if (remoteId) {
                            db.prepare('UPDATE autores SET remote_id = ?, sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?')
                                .run(remoteId, autor.id);
                        } else {
                            db.prepare('UPDATE autores SET sync_status = 1, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?')
                                .run(autor.id);
                        }
                        exportados++;
                        console.log(`✅ Autor exportado: ${autor.nome} (remote_id: ${remoteId})`);
                    } else {
                        const errText = await response.text();
                        console.warn(`⚠️ Falha ao exportar autor "${autor.nome}": ${response.status} - ${errText}`);
                    }
                } catch (err) {
                    console.error(`❌ Erro ao exportar autor "${autor.nome}": ${err.message}`);
                }
            }

            return { success: true, exportados };
        } catch (error) {
            console.error('Erro em exportarAutores:', error);
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
            const baseUrl = SyncConfig.API_BASE_URL.replace(/\/api$/, '');
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
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
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

    // ==================== IMPORTAÇÃO DE VENDAS ====================

    async importarVendas() {
        try {
            // Buscar timestamp do último sync de vendas
            const ultimoSyncVendas = db.prepare(
                "SELECT valor FROM configuracoes WHERE chave = 'ultimo_sync_vendas'"
            ).get();
            const desde = ultimoSyncVendas?.valor || null;

            let url = `${SyncConfig.API_BASE_URL}${SyncConfig.ENDPOINTS.vendas}`;
            if (desde) url += `?desde=${encodeURIComponent(desde)}`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'SeboAlfarrabioPDV/1.0',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SyncConfig.API_KEY}`
                },
                signal: AbortSignal.timeout(SyncConfig.REQUEST_TIMEOUT)
            });
            const result = await response.json();
            const vendas = result.data || [];

            let importados = 0;

            for (const v of vendas) {
                // Verificar se já existe localmente
                const existente = db.prepare('SELECT id FROM vendas WHERE uuid = ?').get(v.uuid_desktop);
                if (existente) continue;

                // Inserir venda
                const uuid = v.uuid_desktop || this.gerarUUID();
                db.prepare(`
                    INSERT INTO vendas (uuid, usuario_id, data_venda, total, forma_pagamento, status, sync_status, criado_em)
                    VALUES (?, ?, ?, ?, ?, 'concluida', 1, ?)
                `).run(uuid, v.id_usuario || 1, v.data_venda, v.valor_total, v.forma_pagamento, v.criado_em);
                importados++;
            }

            // Atualizar timestamp incremental
            db.prepare(`
                INSERT OR REPLACE INTO configuracoes (chave, valor, atualizado_em)
                VALUES ('ultimo_sync_vendas', ?, CURRENT_TIMESTAMP)
            `).run(new Date().toISOString());

            this.registrarLog('import', 'vendas', importados);
            return { success: true, importados };
        } catch (error) {
            this.registrarLog('import', 'vendas', 0, 'erro', error.message);
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
                this.registrarLog('sync', 'conexao', 0, 'erro', conexao.message);
                return { success: false, message: conexao.message };
            }

            // Processar fila offline primeiro
            const filaResult = await this.processarFila();
            resultados.fila = filaResult;

            // Importar na ordem correta (dependências primeiro)
            resultados.categorias = await this.importarCategorias();
            this.registrarLog('import', 'categorias', resultados.categorias.importados || 0,
                resultados.categorias.success ? 'sucesso' : 'erro', resultados.categorias.error);

            resultados.generos = await this.importarGeneros();
            this.registrarLog('import', 'generos', resultados.generos.importados || 0,
                resultados.generos.success ? 'sucesso' : 'erro', resultados.generos.error);

            resultados.autores = await this.importarAutores();
            this.registrarLog('import', 'autores', resultados.autores.importados || 0,
                resultados.autores.success ? 'sucesso' : 'erro', resultados.autores.error);

            resultados.itens = await this.importarItens();
            this.registrarLog('import', 'itens', resultados.itens.importados || 0,
                resultados.itens.success ? 'sucesso' : 'erro', resultados.itens.error);

            resultados.avaliacoes = await this.importarAvaliacoes();
            resultados.importVendas = await this.importarVendas();

            // Exportar dados locais (ordem importa: categorias antes de gêneros)
            resultados.exportCategorias = await this.exportarCategorias();
            this.registrarLog('export', 'categorias', resultados.exportCategorias.exportados || 0,
                resultados.exportCategorias.success ? 'sucesso' : 'erro', resultados.exportCategorias.error);

            resultados.exportGeneros = await this.exportarGeneros();
            this.registrarLog('export', 'generos', resultados.exportGeneros.exportados || 0,
                resultados.exportGeneros.success ? 'sucesso' : 'erro', resultados.exportGeneros.error);

            resultados.exportAutores = await this.exportarAutores();
            this.registrarLog('export', 'autores', resultados.exportAutores.exportados || 0,
                resultados.exportAutores.success ? 'sucesso' : 'erro', resultados.exportAutores.error);

            resultados.vendas = await this.exportarVendas();
            this.registrarLog('export', 'vendas', resultados.vendas.exportados || 0,
                resultados.vendas.success ? 'sucesso' : 'erro', resultados.vendas.error);

            resultados.exportItens = await this.exportarItens();
            this.registrarLog('export', 'itens', resultados.exportItens.exportados || 0,
                resultados.exportItens.success ? 'sucesso' : 'erro', resultados.exportItens.error);

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
            this.registrarLog('sync', 'geral', 0, 'erro', error.message);
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
