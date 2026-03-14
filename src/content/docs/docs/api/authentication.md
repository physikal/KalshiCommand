---
title: Authentication
description: Kalshi API authentication with RSA-PSS
---

## Overview

The Kalshi API uses RSA-PSS signature-based authentication. Every request requires three headers:

| Header | Description |
|--------|-------------|
| `KALSHI-ACCESS-KEY` | Your API key ID |
| `KALSHI-ACCESS-SIGNATURE` | RSA-PSS signature (base64) |
| `KALSHI-ACCESS-TIMESTAMP` | Unix timestamp (seconds) |

## Signing Process

1. Concatenate: `timestamp + HTTP_METHOD + path` (path without query params)
2. Sign with RSA-PSS using SHA-256 and salt length = digest length
3. Base64-encode the signature

```typescript
const message = timestamp + method.toUpperCase() + path;
const signature = crypto.sign("sha256", Buffer.from(message), {
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
});
return signature.toString("base64");
```

## API Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.elections.kalshi.com/trade-api/v2` |
| Demo | `https://demo-api.kalshi.co/trade-api/v2` |
