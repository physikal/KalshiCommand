---
title: Configuration
description: Environment variables and settings
---

## Environment Variables

The Command Center requires two environment variables for Kalshi API access:

| Variable | Description |
|----------|-------------|
| `KALSHI_API_KEY_ID` | Your Kalshi API key ID (from account settings) |
| `KALSHI_PRIVATE_KEY` | RSA private key in PEM format (newlines as `\n`) |

### Setting the Private Key

The private key must be stored as a single-line string with literal `\n` characters replacing newlines:

```bash
# Convert your PEM file to a single line
cat kalshi-private-key.pem | tr '\n' '\\' | sed 's/\\/\\n/g'
```

Paste the result as the `KALSHI_PRIVATE_KEY` environment variable in Kubero.

## Kubero Deployment Settings

- **Pipeline**: `trading`
- **App**: `kalshi-cc`
- **Namespace**: `trading-production`
- **Build Strategy**: Dockerfile
- **Port**: 4321
