import { getDb, getLastSyncLog } from "./db";
import {
  getBalance,
  getAllFills,
  getAllSettlements,
} from "./kalshi";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
let syncTimer: ReturnType<typeof setInterval> | null = null;

export async function syncFromKalshi(): Promise<{
  fillsAdded: number;
  settlementsAdded: number;
}> {
  const db = getDb();
  let fillsAdded = 0;
  let settlementsAdded = 0;

  try {
    const [balance, fills, settlements] = await Promise.all([
      getBalance(),
      getAllFills(),
      getAllSettlements(),
    ]);

    // Upsert fills
    const insertFill = db.prepare(`
      INSERT OR IGNORE INTO fills
        (trade_id, action, count_fp, created_time, fee_cost,
         is_taker, market_ticker, no_price_dollars, order_id,
         side, ticker, yes_price_dollars)
      VALUES
        (@trade_id, @action, @count_fp, @created_time, @fee_cost,
         @is_taker, @market_ticker, @no_price_dollars, @order_id,
         @side, @ticker, @yes_price_dollars)
    `);

    const insertFills = db.transaction((rows: any[]) => {
      let added = 0;
      for (const fill of rows) {
        const result = insertFill.run({
          trade_id: fill.trade_id,
          action: fill.action,
          count_fp: fill.count_fp,
          created_time: fill.created_time,
          fee_cost: fill.fee_cost ?? "0",
          is_taker: fill.is_taker ? 1 : 0,
          market_ticker: fill.market_ticker ?? fill.ticker,
          no_price_dollars: fill.no_price_dollars,
          order_id: fill.order_id ?? null,
          side: fill.side,
          ticker: fill.ticker,
          yes_price_dollars: fill.yes_price_dollars,
        });
        if (result.changes > 0) added++;
      }
      return added;
    });

    fillsAdded = insertFills(fills);

    // Upsert settlements
    const upsertSettlement = db.prepare(`
      INSERT INTO settlements
        (market_ticker, market_result, revenue, settled_time,
         no_count, no_total_cost, yes_count, yes_total_cost)
      VALUES
        (@market_ticker, @market_result, @revenue, @settled_time,
         @no_count, @no_total_cost, @yes_count, @yes_total_cost)
      ON CONFLICT(market_ticker) DO UPDATE SET
        market_result = excluded.market_result,
        revenue = excluded.revenue,
        settled_time = excluded.settled_time,
        no_count = excluded.no_count,
        no_total_cost = excluded.no_total_cost,
        yes_count = excluded.yes_count,
        yes_total_cost = excluded.yes_total_cost,
        synced_at = datetime('now')
    `);

    const upsertSettlements = db.transaction((rows: any[]) => {
      let added = 0;
      for (const s of rows) {
        const result = upsertSettlement.run({
          market_ticker: s.market_ticker,
          market_result: s.market_result,
          revenue: s.revenue,
          settled_time: s.settled_time,
          no_count: s.no_count ?? 0,
          no_total_cost: s.no_total_cost ?? 0,
          yes_count: s.yes_count ?? 0,
          yes_total_cost: s.yes_total_cost ?? 0,
        });
        if (result.changes > 0) added++;
      }
      return added;
    });

    settlementsAdded = upsertSettlements(settlements);

    // Record balance snapshot
    db.prepare(
      `INSERT INTO balance_snapshots (balance, portfolio_value)
       VALUES (?, ?)`,
    ).run(balance.balance, balance.portfolio_value ?? 0);

    // Log sync
    db.prepare(
      `INSERT INTO sync_log (fills_added, settlements_added, status)
       VALUES (?, ?, 'success')`,
    ).run(fillsAdded, settlementsAdded);

    console.log(
      `[sync] OK: ${fillsAdded} new fills, ${settlementsAdded} settlements updated`,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error(`[sync] Error: ${message}`);

    try {
      db.prepare(
        `INSERT INTO sync_log (status, error) VALUES ('error', ?)`,
      ).run(message);
    } catch {
      // ignore logging failure
    }

    throw err;
  }

  return { fillsAdded, settlementsAdded };
}

export function startAutoSync() {
  if (syncTimer) return;

  // Run initial sync after a short delay (let server finish starting)
  setTimeout(() => {
    syncFromKalshi().catch((err) =>
      console.error("[sync] Initial sync failed:", err.message),
    );
  }, 5000);

  // Schedule recurring syncs
  syncTimer = setInterval(() => {
    syncFromKalshi().catch((err) =>
      console.error("[sync] Periodic sync failed:", err.message),
    );
  }, SYNC_INTERVAL_MS);

  console.log(
    `[sync] Auto-sync started (every ${SYNC_INTERVAL_MS / 60000} min)`,
  );
}

export function isSyncStale(): boolean {
  const last = getLastSyncLog();
  if (!last) return true;
  const elapsed =
    Date.now() - new Date(last.synced_at + "Z").getTime();
  return elapsed > SYNC_INTERVAL_MS;
}
