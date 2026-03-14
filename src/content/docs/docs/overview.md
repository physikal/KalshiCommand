---
title: Overview
description: Kalshi Command Center documentation
---

The Kalshi Command Center is an internal dashboard for monitoring and analyzing your Kalshi prediction market trading bot.

## Features

- **Dashboard** - Real-time portfolio balance, P&L, and exposure metrics
- **Trade Log** - Searchable, paginated history of all executed fills
- **Positions** - Current open positions with exposure and realized P&L
- **Settlements** - Resolved markets with revenue tracking and win rate
- **Documentation** - This section, powered by Starlight

## Architecture

The app is built with:

- **Astro** - Static site generation with server-side API routes
- **Starlight** - Documentation framework (this section)
- **React** - Interactive dashboard components
- **Tailwind CSS** - Mobile-first responsive styling

All Kalshi API calls are made server-side through Astro API routes, keeping your private key secure. The RSA-PSS signing happens on the server, and only portfolio data is sent to the browser.

## Deployment

Deployed to Kubero on the internal k3s cluster. Not exposed externally — accessible only on the local network.
