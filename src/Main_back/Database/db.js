import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

// Caminho do banco: %appdata%/sebo-alfarrabio-pdv/sebo-alfarrabio.db
const dbPath = path.join(app.getPath('userData'), 'sebo-alfarrabio.db');
const db = new Database(dbPath, { verbose: console.log });

export function initDatabase() {
  db.pragma('journal_mode = WAL');

  // Tabela de usuários com autenticação
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL, 
      remote_id INTEGER,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      role TEXT DEFAULT 'vendedor',
      status TEXT DEFAULT 'ativo',
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME
    );
  `);

  // Categorias
  db.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id INTEGER,
      nome TEXT UNIQUE NOT NULL,
      descricao TEXT,
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME
    );
  `);

  // Gêneros (sub-categorias)
  db.exec(`
    CREATE TABLE IF NOT EXISTS generos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id INTEGER,
      nome TEXT NOT NULL,
      categoria_id INTEGER,
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
  `);

  // Autores (NOVA TABELA para sync)
  db.exec(`
    CREATE TABLE IF NOT EXISTS autores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id INTEGER,
      nome TEXT NOT NULL,
      biografia TEXT,
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME
    );
  `);

  // Itens (livros, revistas, etc)
  db.exec(`
    CREATE TABLE IF NOT EXISTS itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      remote_id INTEGER,
      nome TEXT NOT NULL,
      autor TEXT,
      editora TEXT,
      isbn TEXT,
      descricao TEXT,
      preco REAL NOT NULL,
      preco_promocional REAL,
      preco_item REAL,
      tipo TEXT,
      ano_publicacao INTEGER,
      duracao_minutos INTEGER,
      numero_edicao INTEGER,
      categoria_id INTEGER,
      genero_id INTEGER,
      imagem_path TEXT,
      estoque INTEGER DEFAULT 0,
      estoque_minimo INTEGER DEFAULT 5,
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (genero_id) REFERENCES generos(id)
    );
  `);

  // Avaliações/Feedback (NOVA TABELA)
  db.exec(`
    CREATE TABLE IF NOT EXISTS avaliacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remote_id INTEGER UNIQUE,
      nota INTEGER,
      comentario TEXT,
      data_iso DATETIME,
      usuario_id INTEGER,
      usuario_nome TEXT,
      usuario_foto TEXT,
      item_remote_id INTEGER,
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tabela pivot: Item ↔ Autores (para sync)
  db.exec(`
    CREATE TABLE IF NOT EXISTS item_autores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      autor_id INTEGER NOT NULL,
      FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE CASCADE,
      FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE CASCADE
    );
  `);

  // Vendas
  db.exec(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      usuario_id INTEGER NOT NULL,
      data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
      subtotal REAL DEFAULT 0,
      desconto REAL DEFAULT 0,
      total REAL DEFAULT 0,
      forma_pagamento TEXT,
      status TEXT DEFAULT 'aberta',
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `);

  // Itens da venda (carrinho)
  db.exec(`
    CREATE TABLE IF NOT EXISTS itens_venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantidade INTEGER NOT NULL DEFAULT 1,
      preco_unitario REAL NOT NULL,
      desconto_item REAL DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES itens(id)
    );
  `);

  // Configurações
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT UNIQUE NOT NULL,
      valor TEXT,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Log de sincronizações
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      entidade TEXT NOT NULL,
      registros INTEGER DEFAULT 0,
      status TEXT DEFAULT 'sucesso',
      mensagem TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Fila de operações pendentes (offline queue)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operacao TEXT NOT NULL,
      entidade TEXT NOT NULL,
      payload TEXT NOT NULL,
      tentativas INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pendente',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      processado_em DATETIME
    );
  `);

  // Migrations: Adicionar colunas remote_id se não existirem (para bancos existentes)
  const columns = [
    { table: 'categorias', column: 'remote_id', type: 'INTEGER' },
    { table: 'generos', column: 'remote_id', type: 'INTEGER' },
    { table: 'itens', column: 'remote_id', type: 'INTEGER' },
    { table: 'itens', column: 'preco_item', type: 'REAL' },
    { table: 'itens', column: 'tipo', type: 'TEXT' },
    { table: 'itens', column: 'ano_publicacao', type: 'INTEGER' },
    { table: 'itens', column: 'duracao_minutos', type: 'INTEGER' },
    { table: 'itens', column: 'numero_edicao', type: 'INTEGER' },
    { table: 'usuarios', column: 'remote_id', type: 'INTEGER' }
  ];

  columns.forEach(col => {
    try {
      db.exec(`ALTER TABLE ${col.table} ADD COLUMN ${col.column} ${col.type}`);
    } catch (e) { /* coluna já existe */ }
  });

  // LIMPEZA: Remover protocolos redundantes (media://) de itens que foram salvos incorretamente
  try {
    db.exec(`UPDATE itens SET imagem_path = REPLACE(REPLACE(imagem_path, 'media:///', ''), 'media://', '') WHERE imagem_path LIKE 'media://%'`);
    console.log('🧹 Limpeza de protocolos de imagem concluída');
  } catch (e) {
    console.error('❌ Erro ao limpar protocolos de imagem:', e.message);
  }

  // LIMPEZA DE DUPLICADOS (Baseado no remote_id)
  try {
    console.log('🧹 Iniciando limpeza de itens duplicados...');
    db.exec(`
      DELETE FROM itens 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM itens 
        GROUP BY remote_id
      ) AND remote_id IS NOT NULL;
    `);

    db.exec(`
      DELETE FROM categorias 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM categorias 
        GROUP BY remote_id
      ) AND remote_id IS NOT NULL;
    `);

    db.exec(`
      DELETE FROM generos 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM generos 
        GROUP BY remote_id
      ) AND remote_id IS NOT NULL;
    `);
    db.exec(`
      DELETE FROM autores 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM autores 
        GROUP BY remote_id
      ) AND remote_id IS NOT NULL;
    `);



    // DEDUPLICAÇÃO POR NOME (Prioriza o que tem remote_id)
    // Remove genêros locais (sem remote_id) que conflitam com gêneros remotos (com mesmo nome)
    db.exec(`
      DELETE FROM generos 
      WHERE remote_id IS NULL 
      AND nome IN(SELECT nome FROM generos WHERE remote_id IS NOT NULL);
    `);

    // Remove categorias locais (sem remote_id) que conflitam com categorias remotas (com mesmo nome)
    db.exec(`
      DELETE FROM categorias 
      WHERE remote_id IS NULL 
      AND nome IN(SELECT nome FROM categorias WHERE remote_id IS NOT NULL);
    `);

    console.log('✅ Limpeza concluída');
  } catch (e) {
    console.error('❌ Erro na limpeza de duplicados:', e.message);
  }

  // CRIAR ÍNDICES ÚNICOS (Para prevenir novas duplicatas)
  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_itens_remote_id ON itens(remote_id) WHERE remote_id IS NOT NULL`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_remote_id ON categorias(remote_id) WHERE remote_id IS NOT NULL`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_generos_remote_id ON generos(remote_id) WHERE remote_id IS NOT NULL`);
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_autores_remote_id ON autores(remote_id) WHERE remote_id IS NOT NULL`);
  } catch (e) {
    console.error('❌ Erro ao criar índices únicos:', e.message);
  }

  // Seed de admin padrão se não existir
  const adminExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@sebo.com');
  if (!adminExiste) {
    const senhaHash = bcrypt.hashSync('admin123', 10);
    const uuid = crypto.randomUUID();

    db.prepare(`
      INSERT INTO usuarios(uuid, nome, email, senha, role, status)
    VALUES(?, ?, ?, ?, ?, ?)
      `).run(uuid, 'Administrador', 'admin@sebo.com', senhaHash, 'admin', 'ativo');

    console.log('✅ Usuário admin criado: admin@sebo.com / admin123');
  }

  // Seed de categorias padrão para Sebo
  const catExiste = db.prepare('SELECT id FROM categorias LIMIT 1').get();
  if (!catExiste) {
    const categorias = [
      { nome: 'Livros', descricao: 'Livros novos e usados de todos os gêneros' },
      { nome: 'Revistas', descricao: 'Revistas, periódicos e publicações seriadas' },
      { nome: 'Quadrinhos', descricao: 'HQs, mangás, graphic novels' },
      { nome: 'Discos', descricao: 'Vinis, CDs e DVDs' },
      { nome: 'Outros', descricao: 'Itens diversos e colecionáveis' }
    ];
    const insertCat = db.prepare('INSERT INTO categorias (nome, descricao) VALUES (?, ?)');
    categorias.forEach(cat => insertCat.run(cat.nome, cat.descricao));
    console.log('✅ Categorias padrão criadas');
  }

  // Seed de gêneros literários
  const generoExiste = db.prepare('SELECT id FROM generos LIMIT 1').get();
  if (!generoExiste) {
    // Buscar ID da categoria Livros
    const catLivros = db.prepare('SELECT id FROM categorias WHERE nome = ?').get('Livros');
    const catQuadrinhos = db.prepare('SELECT id FROM categorias WHERE nome = ?').get('Quadrinhos');

    const generos = [
      // Gêneros de Livros
      { nome: 'Romance', categoria_id: catLivros?.id },
      { nome: 'Ficção Científica', categoria_id: catLivros?.id },
      { nome: 'Fantasia', categoria_id: catLivros?.id },
      { nome: 'Terror/Horror', categoria_id: catLivros?.id },
      { nome: 'Mistério/Suspense', categoria_id: catLivros?.id },
      { nome: 'Biografia', categoria_id: catLivros?.id },
      { nome: 'História', categoria_id: catLivros?.id },
      { nome: 'Autoajuda', categoria_id: catLivros?.id },
      { nome: 'Infantil', categoria_id: catLivros?.id },
      { nome: 'Juvenil', categoria_id: catLivros?.id },
      { nome: 'Poesia', categoria_id: catLivros?.id },
      { nome: 'Literatura Brasileira', categoria_id: catLivros?.id },
      { nome: 'Literatura Estrangeira', categoria_id: catLivros?.id },
      { nome: 'Acadêmico', categoria_id: catLivros?.id },
      { nome: 'Religião/Espiritualidade', categoria_id: catLivros?.id },
      // Gêneros de Quadrinhos
      { nome: 'Super-heróis', categoria_id: catQuadrinhos?.id },
      { nome: 'Mangá', categoria_id: catQuadrinhos?.id },
      { nome: 'Graphic Novel', categoria_id: catQuadrinhos?.id }
    ];

    const insertGen = db.prepare('INSERT INTO generos (nome, categoria_id) VALUES (?, ?)');
    generos.forEach(gen => insertGen.run(gen.nome, gen.categoria_id));
    console.log('✅ Gêneros literários criados');
  }

  console.log('📚 Banco de dados Sebo Alfarrabio inicializado em:', dbPath);
}

export default db;