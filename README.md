# @boundless/identity-sdk

A TypeScript SDK that wraps `smart-account-kit` to provide passkey-powered smart-wallet authentication for the Boundless platform with zero seed phrases.

## Install

```bash
pnpm add @boundless/identity-sdk
```

## Quick Start

```typescript
import { BoundlessSDK } from '@boundless/identity-sdk';

const sdk = new BoundlessSDK({
  network: 'testnet',
  rpId: 'boundlessfi.xyz',
  rpName: 'Boundless',
  backendUrl: 'https://api.boundlessfi.xyz',
});

// Connect (silent restore) or force prompt
await sdk.connect({ prompt: true });

// Sign and submit a transaction
await sdk.signAndSubmit(myTransaction);
```

## Configuration Reference

| Field | Type | Description |
|---|---|---|
| `network` | `'mainnet' \| 'testnet'` | Resolves network passphrase, RPC URL, and contract hashes automatically. |
| `rpcUrl` | `string` | (Optional) Override default Soroban RPC URL. |
| `rpId` | `string` | WebAuthn Relying Party ID. Must match the origin. |
| `rpName` | `string` | Human-readable app name shown in passkey prompt. |
| `backendUrl` | `string` | URL of the consuming app's backend (for Better-Auth). |
| `relayerProxyUrl` | `string` | (Optional) Proxy URL for fee sponsoring via Launchtube. |
| `storage` | `StorageAdapter` | (Optional) Override default IndexedDB storage. |

## Server Plugin Setup

Enables linking Stellar wallets to Better-Auth sessions.

```typescript
// boundless-backend/src/auth.ts
import { betterAuth } from 'better-auth';
import { boundlessStellarPlugin } from '@boundless/identity-sdk/server';

export const auth = betterAuth({
  database: db,
  plugins: [ boundlessStellarPlugin() ],
  cookie: {
    domain: '.boundlessfi.xyz', // Wildcard is REQUIRED for cross-subdomain sessions
  },
  trustedOrigins: [
    'https://boundlessfi.xyz',
    'https://bounties.boundlessfi.xyz',
  ],
});
```

**Why wildcard cookie?**
The SDK does not manage sessions; it relies on the browser sending the cookie set by the main backend. A wildcard domain like `.boundlessfi.xyz` ensures the session cookie is available across all subdomains where the SDK might be running.

## Relayer / Fee Sponsoring

The SDK **never** holds or sends a Launchtube JWT itself.
Use `relayerProxyUrl` in the config to point to your own backend endpoint.

**Your backend proxy:**

1. Accepts the request.
2. Attaches `Authorization: Bearer <JWT>` (from env).
3. Forwards to Launchtube.

## Recovery Keys & Domain Locking

**Risk:** Passkeys are bound to `rpId` (domain) at creation. If `boundlessfi.xyz` goes down, the passkey is unusable.

**Mitigation:** The SDK exposes `addRecoveryKey` to enroll a second device or domain on the same Smart Account.

```typescript
await sdk.addRecoveryKey({
  appName: 'Boundless Recovery',
  userName: 'Recovery Device',
  nickname: 'Backup Phone',
});
```

> [!WARNING]
> **Removing Credentials:**
> `removeCredential(id)` removes a passkey. If you remove the **last** credential, the wallet becomes **permanently inaccessible**. The SDK does not guard against this. Passphrases are not supported.

## Polyrepo Dev Setup

To work on the SDK while consuming it in another repo:

1. In this repo: `pnpm install && pnpm build`
2. In consuming repo: `pnpm link /path/to/boundless-identity-sdk/packages/sdk`

## License

MIT
