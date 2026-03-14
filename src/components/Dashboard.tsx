import { useEffect, useState } from "react";
import StatCard from "./StatCard";

interface OverviewData {
  balance: {
    balance: number;
    portfolio_value: number;
  };
  fills: Array<{
    action: string;
    count_fp: string;
    created_time: string;
    side: string;
    ticker: string;
    trade_id: string;
    yes_price_dollars: string;
    no_price_dollars: string;
  }>;
  settlements: Array<{
    market_result: string;
    market_ticker: string;
    revenue: number;
    settled_time: string;
  }>;
  positions: {
    event_positions: Array<{
      event_ticker: string;
      market_positions: Array<{
        position: number;
        market_exposure: number;
        realized_pnl: number;
      }>;
    }>;
    market_positions: Array<{
      position: number;
      market_exposure: number;
      realized_pnl: number;
      market_ticker: string;
    }>;
  };
}

function formatDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Dashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portfolio?section=overview")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setData(d as OverviewData))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-surface-700">
          Loading portfolio data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-loss/10 border border-loss/30 p-4 text-loss text-sm">
        Failed to load portfolio: {error}
      </div>
    );
  }

  if (!data) return null;

  const allPositions =
    data.positions.market_positions ??
    data.positions.event_positions?.flatMap(
      (ep) => ep.market_positions,
    ) ??
    [];

  const totalExposure = allPositions.reduce(
    (s, p) => s + (p.market_exposure ?? 0),
    0,
  );
  const totalRealizedPnl = allPositions.reduce(
    (s, p) => s + (p.realized_pnl ?? 0),
    0,
  );
  const settlementRevenue = (data.settlements ?? []).reduce(
    (s, x) => s + (x.revenue ?? 0),
    0,
  );
  const totalPnl = totalRealizedPnl + settlementRevenue;

  const todayStr = new Date().toISOString().slice(0, 10);
  const fills = data.fills ?? [];
  const todayFills = fills.filter(
    (f) => f.created_time?.slice(0, 10) === todayStr,
  );
  const recentFills = fills.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Balance"
          value={formatDollars(data.balance.balance)}
          subvalue={`Portfolio: ${formatDollars(data.balance.portfolio_value)}`}
        />
        <StatCard
          label="Total P&L"
          value={formatDollars(totalPnl)}
          trend={
            totalPnl > 0 ? "up" : totalPnl < 0 ? "down" : "neutral"
          }
        />
        <StatCard
          label="Exposure"
          value={formatDollars(totalExposure)}
          subvalue={`${allPositions.length} positions`}
        />
        <StatCard
          label="Today's Trades"
          value={todayFills.length.toString()}
          subvalue={`${fills.length} all-time`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
          <h3 className="text-sm font-medium text-surface-200 mb-3">
            Recent Trades
          </h3>
          {recentFills.length === 0 ? (
            <p className="text-surface-700 text-sm">No trades yet</p>
          ) : (
            <div className="space-y-2">
              {recentFills.map((fill) => (
                <div
                  key={fill.trade_id}
                  className="flex items-center justify-between py-1.5 border-b border-surface-800 last:border-0"
                >
                  <div>
                    <span className="font-mono text-xs text-brand-400">
                      {fill.ticker}
                    </span>
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        fill.side === "yes"
                          ? "bg-gain/20 text-gain"
                          : "bg-loss/20 text-loss"
                      }`}
                    >
                      {fill.side}
                    </span>
                  </div>
                  <div className="text-right text-xs text-surface-200">
                    {fill.count_fp} @ ${fill.yes_price_dollars}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
          <h3 className="text-sm font-medium text-surface-200 mb-3">
            Settlement Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-surface-200 text-sm">
                Total Settlements
              </span>
              <span className="tabular-nums">
                {(data.settlements ?? []).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-200 text-sm">Revenue</span>
              <span
                className={`tabular-nums font-medium ${
                  settlementRevenue >= 0 ? "text-gain" : "text-loss"
                }`}
              >
                {formatDollars(settlementRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-200 text-sm">Win Rate</span>
              <span className="tabular-nums">
                {(data.settlements ?? []).length > 0
                  ? `${Math.round(
                      (data.settlements.filter((s) => s.revenue > 0)
                        .length /
                        data.settlements.length) *
                        100,
                    )}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
