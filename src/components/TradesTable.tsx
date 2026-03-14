import { useState } from "react";

interface Fill {
  action: string;
  count_fp: string;
  created_time: string;
  side: string;
  ticker: string;
  trade_id: string;
  yes_price_dollars: string;
  no_price_dollars: string;
}

interface TradesTableProps {
  fills: Fill[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TradesTable({ fills }: TradesTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 25;

  const filtered = fills.filter((f) =>
    f.ticker.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const pageSlice = filtered.slice(
    page * perPage,
    (page + 1) * perPage,
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search by ticker..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="w-full md:w-72 mb-4 px-3 py-2 rounded-lg bg-surface-900 border border-surface-800 text-sm text-surface-50 placeholder-surface-700 focus:border-brand-500 focus:outline-none"
      />
      <div className="overflow-x-auto rounded-xl border border-surface-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-900 text-surface-200 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Ticker</th>
              <th className="px-4 py-3 text-left">Side</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Yes</th>
              <th className="px-4 py-3 text-right">No</th>
            </tr>
          </thead>
          <tbody>
            {pageSlice.map((fill) => (
              <tr
                key={fill.trade_id}
                className="border-t border-surface-800 hover:bg-surface-900/50 transition-colors"
              >
                <td className="px-4 py-3 text-surface-200 whitespace-nowrap">
                  {formatDate(fill.created_time)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-brand-400">
                  {fill.ticker}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      fill.side === "yes"
                        ? "bg-gain/20 text-gain"
                        : "bg-loss/20 text-loss"
                    }`}
                  >
                    {fill.side}
                  </span>
                </td>
                <td className="px-4 py-3 text-surface-200 capitalize">
                  {fill.action}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {fill.count_fp}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  ${fill.yes_price_dollars}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  ${fill.no_price_dollars}
                </td>
              </tr>
            ))}
            {pageSlice.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-surface-700"
                >
                  {search
                    ? "No trades match your search"
                    : "No trades found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-surface-700">
            {filtered.length} trades total
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
