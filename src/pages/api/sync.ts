import type { APIRoute } from "astro";
import { syncFromKalshi } from "../../lib/sync";
import { getSyncStats } from "../../lib/db";

export const POST: APIRoute = async () => {
  try {
    const result = await syncFromKalshi();
    const stats = getSyncStats();
    return Response.json({ ...result, stats });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
};

export const GET: APIRoute = async () => {
  const stats = getSyncStats();
  return Response.json(stats);
};
