import { useState } from "react";

interface Fill {
  action: string;
  count_fp: string;
  created_time: string;
  fee_cost: string;
  side: string;
  ticker: string;
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

interface Settlement {
  market_result: string;
  market_ticker: string;
  revenue: number;
  settled_time: string;
  no_count: number;
  no_total_cost: number;
  yes_count: number;
  yes_total_cost: number;
}

interface TaxSummaryProps {
  fills: Fill[];
  positions: MarketPosition[];
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

function fmtCents(cents: number): string {
  return fmtDollars(cents / 100);
}

function downloadCsv(filename: string, rows: string[][]) {
  const escaped = rows.map((row) =>
    row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
  );
  const csv = escaped.join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TaxSummary({
  fills,
  positions,
  settlements,
}: TaxSummaryProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    new Set([
      currentYear,
      ...fills.map((f) => new Date(f.created_time).getFullYear()),
      ...settlements.map((s) => new Date(s.settled_time).getFullYear()),
    ]),
  ).sort((a, b) => b - a);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const yearFills = fills.filter(
    (f) => new Date(f.created_time).getFullYear() === selectedYear,
  );
  const yearSettlements = settlements.filter(
    (s) => new Date(s.settled_time).getFullYear() === selectedYear,
  );

  const totalFees = yearFills.reduce(
    (sum, f) => sum + parseFloat(f.fee_cost || "0"),
    0,
  );
  const positionFees = positions.reduce(
    (sum, p) => sum + parseFloat(p.fees_paid_dollars),
    0,
  );

  const totalRealizedPnl = positions.reduce(
    (sum, p) => sum + parseFloat(p.realized_pnl_dollars),
    0,
  );

  const settlementRevenue = yearSettlements.reduce(
    (sum, s) => sum + s.revenue,
    0,
  );
  const settlementCost = yearSettlements.reduce(
    (sum, s) => sum + s.yes_total_cost + s.no_total_cost,
    0,
  );
  const settlementGain = yearSettlements.reduce(
    (sum, s) => sum + (s.revenue - s.yes_total_cost - s.no_total_cost),
    0,
  );

  const wins = yearSettlements.filter((s) => s.revenue > 0);
  const losses = yearSettlements.filter(
    (s) => s.revenue <= 0 && (s.yes_total_cost + s.no_total_cost) > 0,
  );
  const totalGains = wins.reduce(
    (sum, s) => sum + (s.revenue - s.yes_total_cost - s.no_total_cost),
    0,
  );
  const totalLosses = losses.reduce(
    (sum, s) => sum + (s.revenue - s.yes_total_cost - s.no_total_cost),
    0,
  );

  const netPnl = totalRealizedPnl + settlementGain;

  const totalVolume = yearFills.reduce((sum, f) => {
    const qty = parseFloat(f.count_fp);
    const price =
      f.side === "yes"
        ? parseFloat(f.yes_price_dollars)
        : parseFloat(f.no_price_dollars);
    return sum + qty * price;
  }, 0);

  function exportFillsCsv() {
    const header = [
      "Date",
      "Ticker",
      "Side",
      "Action",
      "Quantity",
      "Yes Price",
      "No Price",
      "Fee",
    ];
    const rows = yearFills.map((f) => [
      f.created_time,
      f.ticker,
      f.side,
      f.action,
      f.count_fp,
      f.yes_price_dollars,
      f.no_price_dollars,
      f.fee_cost || "0",
    ]);
    downloadCsv(`kalshi-fills-${selectedYear}.csv`, [header, ...rows]);
  }

  function exportSettlementsCsv() {
    const header = [
      "Settled Date",
      "Market",
      "Result",
      "Yes Count",
      "Yes Cost",
      "No Count",
      "No Cost",
      "Revenue",
      "Net Gain/Loss",
    ];
    const rows = yearSettlements.map((s) => [
      s.settled_time,
      s.market_ticker,
      s.market_result,
      s.yes_count.toString(),
      fmtCents(s.yes_total_cost),
      s.no_count.toString(),
      fmtCents(s.no_total_cost),
      fmtCents(s.revenue),
      fmtCents(s.revenue - s.yes_total_cost - s.no_total_cost),
    ]);
    downloadCsv(`kalshi-settlements-${selectedYear}.csv`, [header, ...rows]);
  }

  function exportFullCsv() {
    const header = [
      "Type",
      "Date",
      "Ticker",
      "Side",
      "Action/Result",
      "Quantity",
      "Price",
      "Cost Basis",
      "Revenue",
      "Net Gain/Loss",
      "Fee",
    ];
    const fillRows: string[][] = yearFills.map((f) => {
      const price =
        f.side === "yes" ? f.yes_price_dollars : f.no_price_dollars;
      const qty = parseFloat(f.count_fp);
      const cost = (qty * parseFloat(price)).toFixed(4);
      return [
        "Trade",
        f.created_time,
        f.ticker,
        f.side,
        f.action,
        f.count_fp,
        `$${price}`,
        `$${cost}`,
        "",
        "",
        `$${f.fee_cost || "0"}`,
      ];
    });
    const settlementRows: string[][] = yearSettlements.map((s) => {
      const cost = s.yes_total_cost + s.no_total_cost;
      const net = s.revenue - cost;
      return [
        "Settlement",
        s.settled_time,
        s.market_ticker,
        "",
        s.market_result,
        `${s.yes_count + s.no_count}`,
        "",
        fmtCents(cost),
        fmtCents(s.revenue),
        fmtCents(net),
        "",
      ];
    });
    downloadCsv(`kalshi-tax-report-${selectedYear}.csv`, [
      header,
      ...fillRows,
      ...settlementRows,
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <label
            htmlFor="tax-year"
            className="text-sm text-surface-200"
          >
            Tax Year
          </label>
          <select
            id="tax-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-50 focus:border-brand-500 focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportFillsCsv}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-800 text-xs text-surface-200 hover:bg-surface-800 transition-colors"
          >
            Export Trades
          </button>
          <button
            onClick={exportSettlementsCsv}
            className="px-3 py-1.5 rounded-lg bg-surface-900 border border-surface-800 text-xs text-surface-200 hover:bg-surface-800 transition-colors"
          >
            Export Settlements
          </button>
          <button
            onClick={exportFullCsv}
            className="px-3 py-1.5 rounded-lg bg-brand-600 border border-brand-500 text-xs text-white hover:bg-brand-500 transition-colors"
          >
            Full Tax Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4">
          <p className="text-xs text-surface-200 uppercase tracking-wider mb-1">
            Net P&L
          </p>
          <p
            className={`text-2xl font-bold tracking-tight ${
              netPnl > 0
                ? "text-gain"
                : netPnl < 0
                  ? "text-loss"
                  : "text-surface-200"
            }`}
          >
            {fmtDollars(netPnl)}
          </p>
          <p className="text-xs text-surface-700 mt-1">
            Realized + settlements
          </p>
        </div>
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4">
          <p className="text-xs text-surface-200 uppercase tracking-wider mb-1">
            Total Fees
          </p>
          <p className="text-2xl font-bold tracking-tight text-surface-200">
            {fmtDollars(totalFees)}
          </p>
          <p className="text-xs text-surface-700 mt-1">
            Tax deductible
          </p>
        </div>
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4">
          <p className="text-xs text-surface-200 uppercase tracking-wider mb-1">
            Volume Traded
          </p>
          <p className="text-2xl font-bold tracking-tight text-surface-200">
            {fmtDollars(totalVolume)}
          </p>
          <p className="text-xs text-surface-700 mt-1">
            {yearFills.length} trades
          </p>
        </div>
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4">
          <p className="text-xs text-surface-200 uppercase tracking-wider mb-1">
            Settlements
          </p>
          <p className="text-2xl font-bold tracking-tight text-surface-200">
            {yearSettlements.length}
          </p>
          <p className="text-xs text-surface-700 mt-1">
            {wins.length}W / {losses.length}L
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
        <h3 className="text-sm font-medium text-surface-200 mb-4">
          Tax Breakdown
        </h3>
        <p className="text-xs text-surface-700 mb-4">
          Kalshi prediction market gains are taxed as short-term capital
          gains. All positions settle within one year.
        </p>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-surface-800">
            <span className="text-sm text-surface-200">
              Settlement Revenue
            </span>
            <span className="tabular-nums text-sm">
              {fmtCents(settlementRevenue)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-800">
            <span className="text-sm text-surface-200">
              Settlement Cost Basis
            </span>
            <span className="tabular-nums text-sm">
              {fmtCents(settlementCost)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-800">
            <span className="text-sm text-surface-200">
              Settlement Net Gain/Loss
            </span>
            <span
              className={`tabular-nums text-sm font-medium ${
                settlementGain > 0
                  ? "text-gain"
                  : settlementGain < 0
                    ? "text-loss"
                    : ""
              }`}
            >
              {fmtCents(settlementGain)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-800">
            <span className="text-sm text-surface-200">
              Realized P&L (Closed Positions)
            </span>
            <span
              className={`tabular-nums text-sm font-medium ${
                totalRealizedPnl > 0
                  ? "text-gain"
                  : totalRealizedPnl < 0
                    ? "text-loss"
                    : ""
              }`}
            >
              {fmtDollars(totalRealizedPnl)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-800">
            <span className="text-sm text-surface-200">
              Total Fees Paid
            </span>
            <span className="tabular-nums text-sm text-warn">
              {fmtDollars(positionFees)}
            </span>
          </div>
          <div className="flex justify-between py-2 bg-surface-800/30 rounded px-2 -mx-2">
            <span className="text-sm font-medium text-surface-50">
              Taxable Amount (Gains − Fees)
            </span>
            <span
              className={`tabular-nums text-sm font-bold ${
                netPnl - positionFees > 0
                  ? "text-gain"
                  : netPnl - positionFees < 0
                    ? "text-loss"
                    : ""
              }`}
            >
              {fmtDollars(netPnl - positionFees)}
            </span>
          </div>
        </div>
      </div>

      {yearSettlements.length > 0 ? (
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-4 md:p-5">
          <h3 className="text-sm font-medium text-surface-200 mb-3">
            Settlement Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-surface-200 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Market</th>
                  <th className="px-3 py-2 text-left">Result</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {yearSettlements.map((s, i) => {
                  const cost = s.yes_total_cost + s.no_total_cost;
                  const net = s.revenue - cost;
                  return (
                    <tr
                      key={`${s.market_ticker}-${i}`}
                      className="border-t border-surface-800"
                    >
                      <td className="px-3 py-2 text-surface-200 whitespace-nowrap">
                        {new Date(s.settled_time).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-brand-400">
                        {s.market_ticker}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            s.market_result === "yes"
                              ? "bg-gain/20 text-gain"
                              : "bg-loss/20 text-loss"
                          }`}
                        >
                          {s.market_result}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {fmtCents(cost)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {fmtCents(s.revenue)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right tabular-nums font-medium ${
                          net > 0
                            ? "text-gain"
                            : net < 0
                              ? "text-loss"
                              : ""
                        }`}
                      >
                        {fmtCents(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-900 border border-surface-800 p-6 text-center">
          <p className="text-surface-700 text-sm">
            No settlements in {selectedYear}. Tax liability from
            settlements will appear here once markets resolve.
          </p>
        </div>
      )}

      <div className="rounded-xl bg-surface-800/30 border border-surface-800 p-4">
        <p className="text-xs text-surface-700">
          <strong className="text-surface-200">Disclaimer:</strong>{" "}
          This is an informational summary, not tax advice. Kalshi
          will issue a 1099 form for reportable gains. Consult a tax
          professional for your specific situation.
        </p>
      </div>
    </div>
  );
}
