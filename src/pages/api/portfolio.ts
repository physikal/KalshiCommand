import type { APIRoute } from "astro";
import {
  getBalance,
  getPositions,
} from "../../lib/kalshi";
import {
  getAllFillsFromDb,
  getAllSettlementsFromDb,
  getLatestBalance,
} from "../../lib/db";
import { startAutoSync } from "../../lib/sync";

// Start auto-sync on first API hit
let syncStarted = false;

export const GET: APIRoute = async ({ url }) => {
  if (!syncStarted) {
    startAutoSync();
    syncStarted = true;
  }

  const section = url.searchParams.get("section");

  try {
    switch (section) {
      case "balance": {
        const data = await getBalance();
        return Response.json(data);
      }
      case "fills": {
        const fills = getAllFillsFromDb();
        return Response.json({ fills });
      }
      case "positions": {
        const data = await getPositions();
        return Response.json(data);
      }
      case "settlements": {
        const settlements = getAllSettlementsFromDb();
        return Response.json({ settlements });
      }
      case "overview": {
        const [balance, positions] = await Promise.all([
          getBalance(),
          getPositions(),
        ]);
        const fills = getAllFillsFromDb();
        const settlements = getAllSettlementsFromDb();
        return Response.json({
          balance,
          fills,
          positions,
          settlements,
        });
      }
      default:
        return Response.json(
          { error: "Invalid section parameter" },
          { status: 400 },
        );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};
