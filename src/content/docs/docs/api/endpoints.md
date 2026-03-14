---
title: Endpoints
description: Kalshi API endpoints used by the Command Center
---

## Portfolio Endpoints

### GET /portfolio/balance

Returns current account balance and potential payout.

```json
{
  "balance": 50000,
  "payout": 12500
}
```

Values are in **cents** (divide by 100 for dollars).

### GET /portfolio/fills

Returns trade execution history. Supports pagination via `cursor` and `limit` params.

```json
{
  "cursor": "...",
  "fills": [
    {
      "action": "buy",
      "count": 10,
      "created_time": "2026-03-14T12:00:00Z",
      "is_taker": true,
      "no_price": 45,
      "order_id": "...",
      "side": "yes",
      "ticker": "MARKET-TICKER",
      "trade_id": "...",
      "yes_price": 55
    }
  ]
}
```

### GET /portfolio/positions

Returns current open positions grouped by event.

```json
{
  "event_positions": [
    {
      "event_ticker": "EVENT",
      "market_positions": [
        {
          "market_ticker": "MARKET",
          "position": 10,
          "market_exposure": 5500,
          "realized_pnl": 200,
          "total_traded": 10000
        }
      ]
    }
  ]
}
```

### GET /portfolio/settlements

Returns settlement history for resolved markets.

```json
{
  "settlements": [
    {
      "market_result": "yes",
      "market_ticker": "MARKET",
      "no_count": 0,
      "no_total_cost": 0,
      "revenue": 1000,
      "settled_time": "2026-03-14T00:00:00Z",
      "yes_count": 10,
      "yes_total_cost": 5500
    }
  ]
}
```
