import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
//                        no explore %appdata%
const dbPath = path.join(app.getPath('userData'), 'kipedreiro.db');
const db = new Database(dbPath, { verbose: console.log });

export function initDatabase() {
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT, 
      nome TEXT NOT NULL,
      idade INTEGER,
      sync_status INTEGER DEFAULT 0, -- 0 = Pendente, 1 = Sincronizado
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME,
      excluido_em DATETIME -- Se estiver preenchido, o registro foi "deletado"
    );
  `);
  
  console.log('Banco de dados inicializado em:', dbPath);
}

export default db;