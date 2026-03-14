interface MarketPosition {
  ticker: string;
  position_fp: string;
  market_exposure_dollars: string;
  realized_pnl_dollars: string;
  total_traded_dollars: string;
  fees_paid_dollars: string;
  resting_orders_count: number;
}

interface PositionsTableProps {
  positions: MarketPosition[];
}

export default function PositionsTable({
  positions,
}: PositionsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-900 text-surface-200 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Ticker</th>
            <th className="px-4 py-3 text-right">Position</th>
            <th className="px-4 py-3 text-right">Exposure</th>
            <th className="px-4 py-3 text-right">Realized P&L</th>
            <th className="px-4 py-3 text-right">Volume</th>
            <th className="px-4 py-3 text-right">Fees</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => {
            const position = parseFloat(pos.position_fp);
            const pnl = parseFloat(pos.realized_pnl_dollars);
            return (
              <tr
                key={pos.ticker}
                className="border-t border-surface-800 hover:bg-surface-900/50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-brand-400">
                  {pos.ticker}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span
                    className={
                      position > 0
                        ? "text-gain"
                        : position < 0
                          ? "text-loss"
                          : ""
                    }
                  >
                    {pos.position_fp}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  ${pos.market_exposure_dollars}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span
                    className={
                      pnl > 0
                        ? "text-gain"
                        : pnl < 0
                          ? "text-loss"
                          : ""
                    }
                  >
                    ${pos.realized_pnl_dollars}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  ${pos.total_traded_dollars}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  ${pos.fees_paid_dollars}
                </td>
              </tr>
            );
          })}
          {positions.length === 0 && (
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
