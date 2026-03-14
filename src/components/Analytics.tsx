interface Fill {
  action: string;
  count_fp: string;
  created_time: string;
  fee_cost: string;
  side: string;
  ticker: string;
  market_ticker: string;
  yes_price_dollars: string;
  no_price_dollars: string;
}

interface MarketPosition {
  ticker: string;
  position_fp: string;
  market_exposure_dollars: string;
  realized_pnl_dollars: string;
  total_traded_dollars: string;
  fees_paid_dollars: string;
}

interface EventPosition {
  event_ticker: string;
  event_exposure_dollars: string;
  realized_pnl_dollars: string;
  total_cost_dollars: string;
  total_cost_shares_fp: string;
}

interface Settlement {
  market_result: string;
  market_ticker: string;
  revenue: number;
  settled_time: string;
  yes_total_cost: number;
  no_total_cost: number;
}

interface AnalyticsProps {
  fills: Fill[];
  marketPositions: MarketPosition[];
  eventPositions: EventPosition[];
  settlements: Settlement[];
}

function fmtDollars(val: number): string {
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return val < 0 ? `-$${formatted}` : `$${formatted}`;
}

function EventBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-brand-400 w-44 truncate shrink-0">
        {label}
      </span>
      <div className="flex-1 bg-surface-800 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-surface-200 w-20 text-right shrink-0">
        {fmtDollars(value)}
      </span>
    </div>
  );
}

export default function Analytics({
  fills,
  marketPositions,
  eventPositions,
  settlements,
}: AnalyticsProps) {
  const totalRealizedPnl = marketPositions.reduce(
    (sum, p) => sum + parseFloat(p.realized_pnl_dollars),
    0,
  );
  const totalExposure = marketPositions.reduce(
    (sum, p) => sum + parseFloat(p.market_exposure_dollars),
    0,
  );
  const totalFees = marketPositions.reduce(
    (sum, p) => sum + parseFloat(p.fees_paid_dollars),
    0,
  );
  const totalVolume = marketPositions.reduce(
    (sum, p) => sum + parseFloat(p.total_traded_dollars),
    0,
  );

  const settlementWins = settlements.filter((s) => s.revenue > 0);
  const winRate =
    settlements.length > 0
      ? Math.round((settlementWins.length / settlements.length) * 100)
      : null;

  // Trading activity by day
  const activityByDay = new Map<string, number>();
  for (const f of fills) {
    const day = f.created_time.slice(0, 10);
    activityByDay.set(day, (activityByDay.get(day) ?? 0) + 1);
  }
  const sortedDays = Array.from(activityByDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30);
  const maxDayTrades = Math.max(...sortedDays.map(([, v]) => v), 1);

  // Buy vs sell
  const buys = fills.filter((f) => f.action === "buy");
  const sells = fills.filter((f) => f.action === "sell");
  const buyVolume = buys.reduce((sum, f) => {
    const price =
      f.side === "yes"
        ? parseFloat(f.yes_price_dollars)
        : parseFloat(f.no_price_dollars);
    return sum + parseFloat(f.count_fp) * price;
  }, 0);
  const sellVolume = sells.reduce((sum, f) => {
    const price =
      f.side === "yes"
        ? parseFloat(f.yes_price_dollars)
        : parseFloat(f.no_price_dollars);
    return sum + parseFloat(f.count_fp) * price;
  }, 0);

  // Yes vs no side breakdown
  const yesFills = fills.filter((f) => f.side === "yes");
  const noFills = fills.filter((f) => f.side === "no");

  // Top positions by exposure
  const topByExposure = [...marketPositions]
    .sort(
      (a, b) =>
        parseFloat(b.market_exposure_dollars) -
        parseFloat(a.market_exposure_dollars),
    )
    .filter((p) => parseFloat(p.market_exposure_dollars) > 0)
    .slice(0, 10);
  const maxExposure =
    topByExposure.length > 0
      ? parseFloat(topByExposure[0].market_exposure_dollars)
      : 1;

  // Event-level performance
  const eventsSorted = [...eventPositions]
    .sort(
      (a, b) =>
        parseFloat(b.event_exposure_dollars) -
        parseFloat(a.event_exposure_dollars),
    )
    .slice(0, 10);
  const maxEventExposure =
    eventsSorted.length > 0
      ? parseFloat(eventsSorted[0].event_exposure_dollars)
      : 1;

  // Most traded tickers
  const tickerCounts = new Map<string, number>();
  for (const f of fills) {
    const t = f.ticker || f.market_ticker;
    tickerCounts.set(t, (tickerCounts.get(t) ?? 0) + 1);
  }
  const topTickers = Array.from(tickerCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxTickerCount =
    topTickers.length > 0 ? topTickers[0][1] : 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <StatCard
          label="Realized P&L"
          value={fmtDollars(totalRealizedPnl)}
          color={
            totalRealizedPnl > 0
              ? "text-gain"
              : totalRealizedPnl < 0
                ? "text-loss"
                : "text-surface-200"
          }
        />
        <StatCard
          label="Open Exposure"
          value={fmtDollars(totalExposure)}
          color="text-surface-200"
        />
        <StatCard
          label="Total Volume"
          value={fmtDollars(totalVolume)}
          color="text-surface-200"
        />
        <StatCard
          label="Total Fees"
          value={fmtDollars(totalFees)}
          color="text-warn"
        />
        <StatCard
          label="Win Rate"
          value={winRate !== null ? `${winRate}%` : "N/A"}
          color="text-surface-200"
          sub={
            settlements.length > 0
              ? `${settlementWins.length}/${settlements.length}`
              : "No settlements"
          }
        />
      </div>

      {/* Trading activity chart */}
      <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
        <h3 className="text-sm font-medium text-surface-200 mb-4">
          Trading Activity (Last 30 Days)
        </h3>
        {sortedDays.length === 0 ? (
          <p className="text-surface-700 text-sm">No trades yet</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {sortedDays.map(([day, count]) => {
              const heightPct = (count / maxDayTrades) * 100;
              const label = new Date(day + "T12:00:00").toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" },
              );
              return (
                <div
                  key={day}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div className="absolute -top-6 hidden group-hover:block bg-surface-800 text-xs text-surface-200 px-2 py-1 rounded whitespace-nowrap z-10">
                    {label}: {count} trades
                  </div>
                  <div
                    className="w-full rounded-t bg-brand-500/70 hover:bg-brand-400 transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Buy vs Sell */}
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
          <h3 className="text-sm font-medium text-surface-200 mb-4">
            Buy vs Sell
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gain">
                  Buy ({buys.length} trades)
                </span>
                <span className="text-surface-200 tabular-nums">
                  {fmtDollars(buyVolume)}
                </span>
              </div>
              <div className="bg-surface-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gain/60"
                  style={{
                    width: `${
                      buyVolume + sellVolume > 0
                        ? (buyVolume / (buyVolume + sellVolume)) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-loss">
                  Sell ({sells.length} trades)
                </span>
                <span className="text-surface-200 tabular-nums">
                  {fmtDollars(sellVolume)}
                </span>
              </div>
              <div className="bg-surface-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-loss/60"
                  style={{
                    width: `${
                      buyVolume + sellVolume > 0
                        ? (sellVolume / (buyVolume + sellVolume)) * 100
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-surface-800">
            <div className="flex justify-between text-xs">
              <span className="text-surface-200">
                Yes side: {yesFills.length} trades
              </span>
              <span className="text-surface-200">
                No side: {noFills.length} trades
              </span>
            </div>
          </div>
        </div>

        {/* Most Traded */}
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
          <h3 className="text-sm font-medium text-surface-200 mb-4">
            Most Traded Markets
          </h3>
          <div className="space-y-2">
            {topTickers.map(([ticker, count]) => (
              <div key={ticker} className="flex items-center gap-3">
                <span className="font-mono text-xs text-brand-400 w-44 truncate shrink-0">
                  {ticker}
                </span>
                <div className="flex-1 bg-surface-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-500/60"
                    style={{
                      width: `${(count / maxTickerCount) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums text-surface-200 w-8 text-right shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Positions by Exposure */}
      <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
        <h3 className="text-sm font-medium text-surface-200 mb-4">
          Top Positions by Exposure
        </h3>
        {topByExposure.length === 0 ? (
          <p className="text-surface-700 text-sm">
            No open positions
          </p>
        ) : (
          <div className="space-y-2">
            {topByExposure.map((p) => (
              <EventBar
                key={p.ticker}
                label={p.ticker}
                value={parseFloat(p.market_exposure_dollars)}
                max={maxExposure}
                color="bg-brand-500/60"
              />
            ))}
          </div>
        )}
      </div>

      {/* Event-Level Performance */}
      <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
        <h3 className="text-sm font-medium text-surface-200 mb-4">
          Performance by Event
        </h3>
        {eventsSorted.length === 0 ? (
          <p className="text-surface-700 text-sm">No events</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface-200 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Event</th>
                  <th className="px-3 py-2 text-right">Exposure</th>
                  <th className="px-3 py-2 text-right">
                    Realized P&L
                  </th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Contracts</th>
                </tr>
              </thead>
              <tbody>
                {eventsSorted.map((ev) => {
                  const pnl = parseFloat(ev.realized_pnl_dollars);
                  return (
                    <tr
                      key={ev.event_ticker}
                      className="border-t border-surface-800"
                    >
                      <td className="px-3 py-2 font-mono text-xs text-brand-400">
                        {ev.event_ticker}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        ${ev.event_exposure_dollars}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums ${
                          pnl > 0
                            ? "text-gain"
                            : pnl < 0
                              ? "text-loss"
                              : ""
                        }`}
                      >
                        ${ev.realized_pnl_dollars}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        ${ev.total_cost_dollars}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {ev.total_cost_shares_fp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-900 border border-surface-800 p-4">
      <p className="text-xs text-surface-200 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-xl md:text-2xl font-bold tracking-tight ${color}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-surface-700 mt-1">{sub}</p>}
    </div>
  );
}
