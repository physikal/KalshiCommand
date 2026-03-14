import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH ?? "/data/kalshi.db";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS fills (
      trade_id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      count_fp TEXT NOT NULL,
      created_time TEXT NOT NULL,
      fee_cost TEXT DEFAULT '0',
      is_taker INTEGER DEFAULT 0,
      market_ticker TEXT NOT NULL,
      no_price_dollars TEXT NOT NULL,
      order_id TEXT,
      side TEXT NOT NULL,
      ticker TEXT NOT NULL,
      yes_price_dollars TEXT NOT NULL,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settlements (
      market_ticker TEXT PRIMARY KEY,
      market_result TEXT NOT NULL,
      revenue INTEGER NOT NULL,
      settled_time TEXT NOT NULL,
      no_count INTEGER DEFAULT 0,
      no_total_cost INTEGER DEFAULT 0,
      yes_count INTEGER DEFAULT 0,
      yes_total_cost INTEGER DEFAULT 0,
      synced_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS balance_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      balance INTEGER NOT NULL,
      portfolio_value INTEGER NOT NULL,
      recorded_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      synced_at TEXT DEFAULT (datetime('now')),
      fills_added INTEGER DEFAULT 0,
      settlements_added INTEGER DEFAULT 0,
      status TEXT DEFAULT 'success',
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_fills_created
      ON fills(created_time);
    CREATE INDEX IF NOT EXISTS idx_fills_ticker
      ON fills(ticker);
    CREATE INDEX IF NOT EXISTS idx_settlements_settled
      ON settlements(settled_time);
    CREATE INDEX IF NOT EXISTS idx_balance_recorded
      ON balance_snapshots(recorded_at);
  `);

  return _db;
}

export function getAllFillsFromDb() {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM fills ORDER BY created_time DESC",
    )
    .all();
}

export function getFillsByYear(year: number) {
  const db = getDb();
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;
  return db
    .prepare(
      `SELECT * FROM fills
       WHERE created_time >= ? AND created_time < ?
       ORDER BY created_time DESC`,
    )
    .all(start, end);
}

export function getAllSettlementsFromDb() {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM settlements ORDER BY settled_time DESC",
    )
    .all();
}

export function getLatestBalance() {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM balance_snapshots ORDER BY recorded_at DESC LIMIT 1",
    )
    .get() as {
      balance: number;
      portfolio_value: number;
      recorded_at: string;
    } | undefined;
}

export function getBalanceHistory(days = 30) {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM balance_snapshots
       WHERE recorded_at >= datetime('now', ? || ' days')
       ORDER BY recorded_at ASC`,
    )
    .all(`-${days}`) as Array<{
      balance: number;
      portfolio_value: number;
      recorded_at: string;
    }>;
}

export function getLastSyncLog() {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM sync_log ORDER BY synced_at DESC LIMIT 1",
    )
    .get() as {
      synced_at: string;
      fills_added: number;
      settlements_added: number;
      status: string;
      error: string | null;
    } | undefined;
}

export function getSyncStats() {
  const db = getDb();
  const fillCount = db
    .prepare("SELECT COUNT(*) as count FROM fills")
    .get() as { count: number };
  const settlementCount = db
    .prepare("SELECT COUNT(*) as count FROM settlements")
    .get() as { count: number };
  const snapshotCount = db
    .prepare("SELECT COUNT(*) as count FROM balance_snapshots")
    .get() as { count: number };
  const lastSync = getLastSyncLog();

  return {
    fills: fillCount.count,
    settlements: settlementCount.count,
    balanceSnapshots: snapshotCount.count,
    lastSync: lastSync?.synced_at ?? null,
    lastSyncStatus: lastSync?.status ?? null,
  };
}
