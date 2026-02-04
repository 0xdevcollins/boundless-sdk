# @boundlessfi/identity-sdk

The **Boundless Identity SDK** provides a seamless way to integrate **Passkey-based Smart Wallets** into your application. Built on top of [Smart Account Kit](https://github.com/stellar/smart-account-kit) and [Better-Auth](https://github.com/better-auth/better-auth), it enables users to sign up with a passkey, automatically deploying a non-custodial Stellar Smart Wallet that is linked to their authenticated session.

## Features

- 🔑 **Passkey-First Authentication**: Users log in and sign transactions using FaceID, TouchID, or other WebAuthn credentials.
- 🔗 **Session Linking**: Automatically links on-chain smart wallets to your application's user database via Better-Auth.
- 💳 **Smart Wallet Management**: Deploy contracts, track balances, and transfer assets (XLM & Custom Tokens).
- 🛡️ **Recovery**: Add multiple passkeys for account recovery.
- ⛽ **Gas & Fees**: Optimized wrapper for transaction submission.

---

## Installation

```bash
npm install @boundlessfi/identity-sdk
# or
pnpm add @boundlessfi/identity-sdk
```

### Peer Dependencies

Ensure you have the following peer dependencies installed:

```bash
npm install better-auth smart-account-kit
```

---

## Backend Integration

The SDK provides a **Better-Auth Plugin** to handle linking Stellar addresses and Passkey credentials to your users.

### 1. Register the Plugin

In your Better-Auth configuration (e.g., `auth.ts`):

```typescript
import { betterAuth } from "better-auth";
import { boundlessStellarPlugin } from "@boundlessfi/identity-sdk/server";

export const auth = betterAuth({
  // ... your other config
  plugins: [
    boundlessStellarPlugin(), // <--- Add this
  ],
});
```

This plugin automatically adds `stellarAddress` and `credentialId` fields to your User schema and exposes the `/api/auth/stellar/link` endpoint.

---

## Frontend Usage

### 1. Initialize the SDK

Create an instance of `BoundlessSDK` in your application (e.g., via a React Context or global singleton).

```typescript
import { BoundlessSDK } from "@boundlessfi/identity-sdk";

const boundless = new BoundlessSDK({
  network: "testnet", // or "mainnet"
  rpcUrl: "https://soroban-testnet.stellar.org", // Optional, defaults to Horizon
  backendUrl: "http://localhost:3000", // Your Better-Auth API base URL
  rpId: "localhost", // WebAuthn Relying Party ID (domain)
  rpName: "My App", // App Name for Passkey Prompt
  // relayerProxyUrl: "..." // Optional: For gas sponsorship
});
```

### 2. Connect or Register a Wallet

#### Connect (Returning User)

Prompts the user to sign in with an existing passkey. Checks if a wallet is already deployed.

```typescript
const result = await boundless.connect();
// Or force the browser prompt:
// const result = await boundless.connect({ prompt: true });

if (result) {
  console.log("Connected:", result.walletAddress);
}
```

#### Register (New User)

Creates a new Passkey credential, deploys the Smart Wallet on-chain, and links it to the current auth session.
> **Note:** The user must be logged into Better-Auth before calling `register`.

```typescript
try {
  const result = await boundless.register("user_email_or_name");
  console.log("New Wallet Deployed:", result.walletAddress);
} catch (error) {
  console.error("Registration failed:", error);
}
```

### 3. Check Balances

Fetch Native XLM or Custom Token balances.

```typescript
// Native XLM
const xlmBalance = await boundless.getBalance(userAddress);

// Custom Token (by Contract ID)
const usdcBalance = await boundless.getBalance(userAddress, "CDLZFC3SYJYDZS7K67TZIK764C4UGR2HXQ4Q47I2255W577333N3K...");

// Custom Token (by Asset Code:Issuer)
const tokenBalance = await boundless.getBalance(userAddress, "USDC:GBBD47IF...");
```

### 4. Send Transactions

Transfer XLM or Tokens.

```typescript
const txResult = await boundless.transfer(
  "G...", // Recipient Address
  "10.5", // Amount
  "XLM"   // Asset (or Contract ID / Code:Issuer)
);

if (txResult.success) {
  console.log("Tx Hash:", txResult.hash);
}
```

### 5. Account Recovery

Add a secondary passkey (e.g., iCloud Keychain or YubiKey) to ensure access isn't lost.

```typescript
await boundless.addRecoveryKey({
  appName: "My App",
  userName: "user@example.com",
  nickname: "Backup Key"
});
```

---

## Advanced Usage

### Accessing Internal Tools

You can access the underlying `SmartAccountKit` instance for lower-level operations.

```typescript
const kit = boundless.smartAccountKit;
// Use kit directly...
```

### Events

Listen to wallet events for UI updates.

```typescript
const unsubscribe = boundless.onEvent("walletConnected", () => {
  console.log("Wallet connected!");
});
```

## License

MIT
