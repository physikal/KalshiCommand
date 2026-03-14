import type { Position } from "../lib/kalshi";

interface PositionsTableProps {
  positions: Array<{
    event_ticker: string;
    market_positions: Position[];
  }>;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PositionsTable({
  positions,
}: PositionsTableProps) {
  const flat = positions.flatMap((ep) =>
    ep.market_positions.map((mp) => ({
      ...mp,
      event_ticker: ep.event_ticker,
    })),
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-900 text-surface-200 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Event</th>
            <th className="px-4 py-3 text-left">Market</th>
            <th className="px-4 py-3 text-right">Position</th>
            <th className="px-4 py-3 text-right">Exposure</th>
            <th className="px-4 py-3 text-right">Realized P&L</th>
            <th className="px-4 py-3 text-right">Volume</th>
          </tr>
        </thead>
        <tbody>
          {flat.map((pos) => (
            <tr
              key={pos.market_ticker}
              className="border-t border-surface-800 hover:bg-surface-900/50 transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-brand-400">
                {pos.event_ticker}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-surface-200">
                {pos.market_ticker}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span
                  className={
                    pos.position > 0
                      ? "text-gain"
                      : pos.position < 0
                        ? "text-loss"
                        : ""
                  }
                >
                  {pos.position}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCents(pos.market_exposure)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span
                  className={
                    pos.realized_pnl > 0
                      ? "text-gain"
                      : pos.realized_pnl < 0
                        ? "text-loss"
                        : ""
                  }
                >
                  {formatCents(pos.realized_pnl)}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCents(pos.total_traded)}
              </td>
            </tr>
          ))}
          {flat.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-surface-700"
              >
                No open positions
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
