---
title: Architecture
description: How the trading bot works
---

## System Overview

The Kalshi trading bot operates as an autonomous agent that:

1. Researches prediction markets using available data sources
2. Evaluates market opportunities based on configured strategies
3. Executes trades via the Kalshi API
4. Logs all activity for review in this Command Center

## Data Flow

```
Kalshi API <---> Trading Bot <---> Command Center
                     |
                Research Sources
```

The Command Center reads directly from the Kalshi portfolio API to display your current state. It does not interact with the bot directly — it's a read-only view of your portfolio.

## Key Components

### Portfolio API Client
Server-side TypeScript module that handles RSA-PSS authentication and calls the Kalshi REST API. Located in `src/lib/kalshi.ts`.

### API Routes
Astro server routes at `/api/portfolio` that proxy Kalshi API calls, keeping credentials server-side.

### Dashboard Components
React components with client-side interactivity for search, pagination, and data display.
