import type { APIRoute } from "astro";
import {
  getBalance,
  getAllFills,
  getPositions,
  getAllSettlements,
} from "../../lib/kalshi";

export const GET: APIRoute = async ({ url }) => {
  const section = url.searchParams.get("section");

  try {
    switch (section) {
      case "balance": {
        const data = await getBalance();
        return Response.json(data);
      }
      case "fills": {
        const data = await getAllFills();
        return Response.json({ fills: data });
      }
      case "positions": {
        const data = await getPositions();
        return Response.json(data);
      }
      case "settlements": {
        const data = await getAllSettlements();
        return Response.json({ settlements: data });
      }
      case "overview": {
        const [balance, fills, positions, settlements] =
          await Promise.all([
            getBalance(),
            getAllFills(),
            getPositions(),
            getAllSettlements(),
          ]);
        return Response.json({ balance, fills, positions, settlements });
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
