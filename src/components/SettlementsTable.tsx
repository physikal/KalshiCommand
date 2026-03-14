import type { Settlement } from "../lib/kalshi";
import { useState } from "react";

interface SettlementsTableProps {
  settlements: Settlement[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SettlementsTable({
  settlements,
}: SettlementsTableProps) {
  const [page, setPage] = useState(0);
  const perPage = 25;
  const totalPages = Math.ceil(settlements.length / perPage);
  const pageSlice = settlements.slice(
    page * perPage,
    (page + 1) * perPage,
  );

  const totalRevenue = settlements.reduce((s, x) => s + x.revenue, 0);

  return (
    <div>
      <div className="mb-4 px-1 text-sm text-surface-200">
        Total settlement revenue:{" "}
        <span
          className={`font-bold ${totalRevenue >= 0 ? "text-gain" : "text-loss"}`}
        >
          {formatCents(totalRevenue)}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-surface-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-900 text-surface-200 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Settled</th>
              <th className="px-4 py-3 text-left">Market</th>
              <th className="px-4 py-3 text-left">Result</th>
              <th className="px-4 py-3 text-right">Yes / No</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((s, i) => (
              <tr
                key={`${s.market_ticker}-${i}`}
                className="border-t border-surface-800 hover:bg-surface-900/50 transition-colors"
              >
                <td className="px-4 py-3 text-surface-200 whitespace-nowrap">
                  {formatDate(s.settled_time)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-brand-400">
                  {s.market_ticker}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      s.market_result === "yes"
                        ? "bg-gain/20 text-gain"
                        : s.market_result === "no"
                          ? "bg-loss/20 text-loss"
                          : "bg-surface-800 text-surface-200"
                    }`}
                  >
                    {s.market_result}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-surface-200">
                  {s.yes_count} / {s.no_count}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCents(s.yes_total_cost + s.no_total_cost)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span
                    className={
                      s.revenue > 0
                        ? "text-gain"
                        : s.revenue < 0
                          ? "text-loss"
                          : ""
                    }
                  >
                    {formatCents(s.revenue)}
                  </span>
                </td>
              </tr>
            ))}
            {pageSlice.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-surface-700"
                >
                  No settlements found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-surface-700">
            {settlements.length} settlements total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded bg-surface-900 border border-surface-800 disabled:opacity-30 hover:bg-surface-800 transition-colors"
            >
              Prev
            </button>
            <span className="px-3 py-1.5 text-surface-200">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 rounded bg-surface-900 border border-surface-800 disabled:opacity-30 hover:bg-surface-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
