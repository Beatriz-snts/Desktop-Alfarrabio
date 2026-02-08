import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

// Caminho do banco: %appdata%/ki-pedreiro/sebo-pdv.db
const dbPath = path.join(app.getPath('userData'), 'sebo-pdv.db');
const db = new Database(dbPath, { verbose: console.log });

export function initDatabase() {
  db.pragma('journal_mode = WAL');

  // Tabela de usuários com autenticação
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL, 
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
      nome TEXT NOT NULL,
      categoria_id INTEGER,
      sync_status INTEGER DEFAULT 0,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );
  `);

  // Itens (livros, revistas, etc)
  db.exec(`
    CREATE TABLE IF NOT EXISTS itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      nome TEXT NOT NULL,
      autor TEXT,
      editora TEXT,
      isbn TEXT,
      descricao TEXT,
      preco REAL NOT NULL,
      preco_promocional REAL,
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

  // Seed de admin padrão se não existir
  const adminExiste = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@sebo.com');
  if (!adminExiste) {
    const bcrypt = require('bcryptjs');
    const crypto = require('node:crypto');
    const senhaHash = bcrypt.hashSync('admin123', 10);
    const uuid = crypto.randomUUID();

    db.prepare(`
      INSERT INTO usuarios (uuid, nome, email, senha, role, status) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuid, 'Administrador', 'admin@sebo.com', senhaHash, 'admin', 'ativo');

    console.log('Usuário admin criado: admin@sebo.com / admin123');
  }

  // Seed de categorias padrão
  const catExiste = db.prepare('SELECT id FROM categorias LIMIT 1').get();
  if (!catExiste) {
    const categorias = ['Livros', 'Revistas', 'Quadrinhos', 'Outros'];
    const insertCat = db.prepare('INSERT INTO categorias (nome) VALUES (?)');
    categorias.forEach(cat => insertCat.run(cat));
    console.log('Categorias padrão criadas');
  }

  console.log('Banco de dados inicializado em:', dbPath);
}

export default db;