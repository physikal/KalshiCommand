import crypto from "node:crypto";

const KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2";

function buildSignature(
  privateKeyPem: string,
  timestamp: string,
  method: string,
  path: string,
): string {
  const message = timestamp + method.toUpperCase() + path;
  const key = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign("sha256", Buffer.from(message), {
    key,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return signature.toString("base64");
}

function getHeaders(
  method: string,
  path: string,
): Record<string, string> {
  const apiKeyId = import.meta.env.KALSHI_API_KEY_ID;
  const privateKey = (import.meta.env.KALSHI_PRIVATE_KEY ?? "")
    .replace(/\\n/g, "\n");

  if (!apiKeyId || !privateKey) {
    throw new Error("KALSHI_API_KEY_ID and KALSHI_PRIVATE_KEY must be set");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = buildSignature(privateKey, timestamp, method, path);

  return {
    "Content-Type": "application/json",
    "KALSHI-ACCESS-KEY": apiKeyId,
    "KALSHI-ACCESS-SIGNATURE": signature,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
  };
}

async function kalshiFetch<T>(
  path: string,
  method = "GET",
): Promise<T> {
  const url = `${KALSHI_API_BASE}${path}`;
  const headers = getHeaders(method, path);
  const res = await fetch(url, { method, headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kalshi API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface Balance {
  balance: number;
  payout: number;
}

export interface Fill {
  action: string;
  count: number;
  created_time: string;
  is_taker: boolean;
  no_price: number;
  order_id: string;
  side: string;
  ticker: string;
  trade_id: string;
  yes_price: number;
}

export interface FillsResponse {
  cursor: string;
  fills: Fill[];
}

export interface Position {
  event_ticker: string;
  market_ticker: string;
  position: number;
  market_exposure: number;
  realized_pnl: number;
  resting_orders_count: number;
  total_traded: number;
}

export interface PositionsResponse {
  cursor: string;
  event_positions: Array<{
    event_ticker: string;
    market_positions: Position[];
  }>;
}

export interface Settlement {
  market_result: string;
  market_ticker: string;
  no_count: number;
  no_total_cost: number;
  revenue: number;
  settled_time: string;
  yes_count: number;
  yes_total_cost: number;
}

export interface SettlementsResponse {
  cursor: string;
  settlements: Settlement[];
}

export async function getBalance(): Promise<Balance> {
  return kalshiFetch<Balance>("/portfolio/balance");
}

export async function getFills(
  cursor?: string,
  limit = 100,
): Promise<FillsResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.set("cursor", cursor);
  return kalshiFetch<FillsResponse>(
    `/portfolio/fills?${params.toString()}`,
  );
}

export async function getPositions(): Promise<PositionsResponse> {
  return kalshiFetch<PositionsResponse>("/portfolio/positions");
}

export async function getSettlements(
  cursor?: string,
  limit = 100,
): Promise<SettlementsResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.set("cursor", cursor);
  return kalshiFetch<SettlementsResponse>(
    `/portfolio/settlements?${params.toString()}`,
  );
}

export async function getAllFills(): Promise<Fill[]> {
  const allFills: Fill[] = [];
  let cursor: string | undefined;

  do {
    const resp = await getFills(cursor);
    allFills.push(...resp.fills);
    cursor = resp.cursor || undefined;
  } while (cursor);

  return allFills;
}

export async function getAllSettlements(): Promise<Settlement[]> {
  const all: Settlement[] = [];
  let cursor: string | undefined;

  do {
    const resp = await getSettlements(cursor);
    all.push(...resp.settlements);
    cursor = resp.cursor || undefined;
  } while (cursor);

  return all;
}
