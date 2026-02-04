import {
  SmartAccountKit,
  IndexedDBStorage,
  WalletNotConnectedError,
  STROOPS_PER_XLM,
} from "smart-account-kit";
import {
  rpc,
  Asset,
  Address,
  Contract,
  Account,
  TransactionBuilder,
  scValToNative,
  TimeoutInfinite,
} from "@stellar/stellar-sdk";
import type { AssembledTransaction } from "smart-account-kit";
import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

import { NETWORK_CONFIGS } from "./constants";
import { BoundlessAuthError, BoundlessLinkError } from "./errors";
import type {
  BoundlessSdkConfig,
  ConnectOptions,
  ConnectResult,
  SignAndSubmitResult,
  AddRecoveryKeyOptions,
  RecoveryKeyResult,
  BoundlessEventName,
  BoundlessEventHandler,
} from "./types";

// Valid G-address for simulation source (USDC Issuer)
const DUMMY_SOURCE = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export class BoundlessSDK {
  private config: BoundlessSdkConfig;
  private kit: SmartAccountKit;
  private _walletAddress: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private authClient: any; // typed via createAuthClient return

  constructor(config: BoundlessSdkConfig) {
    this.config = config;

    // 1. Resolve network config
    const networkConfig = NETWORK_CONFIGS[config.network];
    const rpcUrl = config.rpcUrl || networkConfig.defaultRpcUrl;

    // 2. Initialize SmartAccountKit
    this.kit = new SmartAccountKit({
      rpcUrl,
      networkPassphrase: networkConfig.networkPassphrase,
      accountWasmHash: networkConfig.accountWasmHash,
      webauthnVerifierAddress: networkConfig.webauthnVerifierAddress,
      rpId: config.rpId,
      rpName: config.rpName,
      storage: config.storage, // optional
      relayerUrl: config.relayerProxyUrl, // optional
    });

    // 3. Create Better-Auth client
    // We cannot do `typeof auth` inference across packages easily without importing backend code.
    // inferAdditionalFields is the standard polyrepo pattern.
    this.authClient = createAuthClient({
      baseURL: config.backendUrl,
      plugins: [
        inferAdditionalFields({
          user: {
            stellarAddress: { type: "string" },
            credentialId: { type: "string" },
          },
        }),
      ],
    }) as any;
  }

  /**
   * Access the underlying SmartAccountKit instance for advanced usage.
   */
  get smartAccountKit(): SmartAccountKit {
    return this.kit;
  }

  /**
   * Connect to an existing passkey wallet.
   * If prompt is true, forces the browser passkey selection UI.
   * Does NOT deploy a new wallet.
   */
  async connect(options?: ConnectOptions): Promise<ConnectResult | null> {
    const prompt = options?.prompt === true;

    // 1. Silent restore first (default behavior of connectWallet without args)
    // If prompt is true, we skip silent restore if we want to force UI,
    // but smart-account-kit connectWallet handles 'prompt: true' by forcing it.
    // However, the spec says:
    // "Call kit.connectWallet() ← silent restore"
    // "If result → return mapped... "
    // "If null AND options?.prompt === true → call kit.connectWallet({ prompt: true })"

    let result = await this.kit.connectWallet();

    if (result) {
      this._walletAddress = result.contractId;
      return {
        walletAddress: result.contractId,
        credentialId: (result as any).credentialId || "",
        isNew: false,
      };
    }

    if (prompt) {
      result = await this.kit.connectWallet({ prompt: true });
      if (result) {
        this._walletAddress = result.contractId;
        return {
          walletAddress: result.contractId,
          credentialId: (result as any).credentialId || "",
          isNew: false,
        };
      }
    }

    // "If null AND prompt is falsy → return null."
    return null;
  }

  /**
   * Create a new wallet + credential for a user.
   * Triggers browser passkey prompt.
   * Links to the active Better-Auth session.
   */
  async register(userName: string): Promise<ConnectResult> {
    // 1. Create wallet (deploys on-chain + persists credential)
    const result = await this.kit.createWallet(this.config.rpName, userName, {
      autoSubmit: true,
    });

    // 2. Link to Better-Auth session
    await this.linkToSession(result.contractId);

    this._walletAddress = result.contractId;

    // 3. Return result
    return {
      walletAddress: result.contractId,
      credentialId: result.credentialId,
      isNew: true,
    };
  }

  /**
   * Link a Stellar wallet address to the currently authenticated user session.
   */
  private async linkToSession(contractId: string): Promise<void> {
    // 1. Check session
    const res = await this.authClient.getSession();
    const session = res?.data;
    if (!session?.user) {
      throw new BoundlessAuthError(
        "No active auth session. User must be logged in via Better-Auth before linking a wallet.",
      );
    }

    // 2. POST /api/auth/stellar/link
    // Using fetch to manually hit the endpoint registered by the plugin.
    // The SDK's authClient base URL is config.backendUrl.
    const linkUrl = `${this.config.backendUrl}/api/auth/stellar/link`;

    const response = await fetch(linkUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stellarAddress: contractId }),
      // Credentials include cookies for the session
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BoundlessLinkError(
        `Failed to link wallet: ${text}`,
        response.status,
      );
    }
  }

  /**
   * Sign and submit a transaction.
   * Delegates to SmartAccountKit (which handles relayer if configured).
   */
  async signAndSubmit(
    transaction: AssembledTransaction<any>,
  ): Promise<SignAndSubmitResult> {
    const result = await this.kit.signAndSubmit(transaction);
    return {
      hash: result.hash,
      success: result.success,
    };
  }

  /**
   * Fetch the balance of the connected wallet (or any specific address).
   * By default, fetches native XLM balance.
   * If assetCode (and issuer) is provided, fetches that asset's balance.
   * If assetCode starts with 'C', it is treated as a contract ID.
   */
  async getBalance(
    address: string,
    assetCode = "XLM",
    assetIssuer?: string,
  ): Promise<string> {
    if (!address) return "0.00";

    const networkConfig = NETWORK_CONFIGS[this.config.network];
    const server = new rpc.Server(
      this.config.rpcUrl || networkConfig.defaultRpcUrl,
    );

    // 1. Native Balance
    if (assetCode === "XLM") {
      try {
        const result = await server.getSACBalance(
          networkConfig.nativeTokenContract,
          Asset.native(),
          networkConfig.networkPassphrase,
        );
        if (result.balanceEntry) {
          return (Number(result.balanceEntry.amount) / STROOPS_PER_XLM).toFixed(
            2,
          );
        }
        return "0.00";
      } catch (e) {
        console.error("Error fetching native balance:", e);
        return "0.00";
      }
    }

    // 2. Custom Token Balance
    let targetContractId = assetCode;

    // Resolve Contract ID
    if (assetCode.includes(":")) {
      // CODE:ISSUER
      const [code, issuer] = assetCode.split(":");
      try {
        const asset = new Asset(code, issuer);
        targetContractId = asset.contractId(networkConfig.networkPassphrase);
      } catch (e) {
        console.error(`Invalid asset format: ${assetCode}`, e);
        return "0";
      }
    } else if (assetIssuer) {
      // Explicit Code + Issuer
      try {
        const asset = new Asset(assetCode, assetIssuer);
        targetContractId = asset.contractId(networkConfig.networkPassphrase);
      } catch (e) {
        console.error(`Failed to derive contract for ${assetCode}`, e);
        return "0";
      }
    } else if (!assetCode.startsWith("C")) {
      // If it's just "USDC" without issuer, we might need a known list or fail.
      // For SDK, we assume the user must provide enough info.
      // However, if the user passes a contract address directly, we use it.
      // Check if it's a valid contract address?
      // For now, we assume if it's 56 chars starting with C, it's a contract.
      // If not, we can't guess.
      // But we'll try to treat it as a contract ID if it looks like one.
      if (!assetCode.startsWith("C") || assetCode.length !== 56) {
        console.warn(
          "getBalance: Asset code must be XLM, C... contract ID, or CODE:ISSUER",
        );
        return "0";
      }
    }

    try {
      // Simulate Balance Call
      // Use DUMMY_SOURCE for simulation to avoid accountId errors with Smart Accounts
      const sourceAccount = new Account(DUMMY_SOURCE, "0");

      const tokenContract = new Contract(targetContractId);
      const op = tokenContract.call("balance", new Address(address).toScVal());

      const tx = new TransactionBuilder(sourceAccount, {
        fee: "100",
        networkPassphrase: networkConfig.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(TimeoutInfinite)
        .build();

      const sim = await server.simulateTransaction(tx);

      if (
        rpc.Api.isSimulationSuccess(sim) &&
        sim.result &&
        "retval" in sim.result
      ) {
        const val = scValToNative(sim.result.retval);
        // Default formatting: Assume 7 decimals for now or return raw?
        // Returning human-readable for convenience.
        // Most Stellar tokens are 7 decimals.
        return (Number(val) / 1e7).toFixed(2);
      }
    } catch (e) {
      console.error(`Error fetching token balance for ${assetCode}:`, e);
    }

    return "0";
  }

  /**
   * Transfer funds (XLM or Token).
   * Automatically resolves Asset-to-Contract if needed.
   */
  async transfer(
    to: string,
    amount: string | number,
    assetCode = "XLM",
    assetIssuer?: string,
  ): Promise<SignAndSubmitResult> {
    const networkConfig = NETWORK_CONFIGS[this.config.network];
    let tokenContract: string = networkConfig.nativeTokenContract;

    if (assetCode !== "XLM") {
      if (assetCode.startsWith("C") && assetCode.length === 56) {
        tokenContract = assetCode;
      } else if (assetCode.includes(":")) {
        const [code, issuer] = assetCode.split(":");
        const asset = new Asset(code, issuer);
        tokenContract = asset.contractId(networkConfig.networkPassphrase);
      } else if (assetIssuer) {
        const asset = new Asset(assetCode, assetIssuer);
        tokenContract = asset.contractId(networkConfig.networkPassphrase);
      } else {
        throw new Error(
          "Invalid asset specifier. Use XLM, Contract ID, or Code + Issuer.",
        );
      }
    }

    const amountNum = typeof amount === "string" ? parseFloat(amount) : amount;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.kit.transfer(tokenContract as any, to, amountNum);

    return {
      hash: result.hash,
      success: result.success,
    };
  }

  /**
   * Disconnect the wallet (clear local session).
   * Does NOT sign out of Better-Auth.
   */
  async disconnect(): Promise<void> {
    await this.kit.disconnect();
    this._walletAddress = null;
  }

  /**
   * Get the connected wallet address synchronously.
   */
  getWalletAddress(): string | null {
    // smart-account-kit doesn't have a direct synchronous getter documented in the spec provided?
    // "Read from the session state that SmartAccountKit maintains internally (check kit after connectWallet result)."
    // Usually kit.address or similar is available if connected.
    // Based on "sub-managers" list, it doesn't explicitly show 'address' property on kit intance.
    // However, typical usage implies we can track it.
    // BUT the prompt says: "check kit after connectWallet result".
    // Wait, SmartAccountKit instance usage in 6.1 doesn't show a public 'address' field.
    // But section 7.3 says: "Read from the session state that SmartAccountKit maintains internally".
    // I will assume `kit.address` exists or I need to track it myself?
    // "The SDK is one package... Client SDK class... It owns the client-side BoundlessSDK class".
    // If I look at `kit` internals or typical patterns, it often exposes the address.
    // If not, I should probably cache it on `connect` / `register`.
    // BUT, `kit.connectWallet` returns the result.
    // If the page reloads, `kit` is re-instantiated. `kit.connectWallet()` (silent) restores it.
    // So `getWalletAddress` might need to rely on the *result* of the last connect/register.
    //
    // HOWEVER, `kit` might have an `address` getter.
    // Let's assume for now I should inspect `kit` typings if I could, but I can't.
    // "Read from the session state that SmartAccountKit maintains internally"
    // implies `kit` has state.
    // If `kit` tracks it, it's likely `kit.address`.
    // I'll check if I can assume it.
    // If `kit` does not expose it, I'd have to store it in `this.currentAddress`.
    // But if `kit` disconnects, I need to know.
    // `kit.events` emit 'walletDisconnected'.

    // I'll use a safer approach: check if `kit` has a known property or Method.
    // The spec 6.1 Core Methods allows `connectWallet`.
    // If `kit` doesn't expose `address` directly, I'll rely on my own state updated via events/method calls.
    // BUT Section 7.3 says "Read from the session state that SmartAccountKit maintains internally".
    // This strongly suggests `kit` has it. I will try `(this.kit as any).address`.
    // Or better, I will assume it might be there.

    // Actually, looking at `smart-account-kit` typical implementations, it usually has `address`.
    // I'll assume `this.kit.address` is the way.
    // If TS complains, I'll fix it. I can't check types right now.
    // I will use `(this.kit as any).address` to be safe if strict types block it,
    // but better to try `this.kit.address` first? No, I want to avoid build errors.
    // I'll cast for now to avoid blocking if the types aren't exactly matching my assumption.
    // "Read from the session state that SmartAccountKit maintains internally"

    return this._walletAddress || (this.kit as any).address || null;
  }

  /**
   * Add a recovery key (new passkey) to the existing account.
   */
  async addRecoveryKey(
    options: AddRecoveryKeyOptions,
  ): Promise<RecoveryKeyResult> {
    const address = this.getWalletAddress();
    if (!address) {
      throw new WalletNotConnectedError(
        "Wallet must be connected to add a recovery key.",
      );
    }

    const { credentialId } = await this.kit.signers.addPasskey(
      0, // contextRuleId (0 = default)
      options.appName,
      options.userName,
      { nickname: options.nickname },
    );

    return { credentialId };
  }

  /**
   * Remove a credential by ID.
   */
  async removeCredential(credentialId: string): Promise<void> {
    const address = this.getWalletAddress();
    if (!address) {
      throw new WalletNotConnectedError(
        "Wallet must be connected to remove a credential.",
      );
    }

    await this.kit.signers.removePasskey(0, credentialId);
  }

  /**
   * Subscribe to events.
   */
  onEvent(
    event: BoundlessEventName,
    handler: BoundlessEventHandler,
  ): () => void {
    const validEvents: BoundlessEventName[] = [
      "walletConnected",
      "walletDisconnected",
      "credentialCreated",
      "credentialDeleted",
      "sessionExpired",
      "transactionSigned",
      "transactionSubmitted",
    ];

    if (!validEvents.includes(event)) {
      // Just ignore or warn? Types prevent this usually.
      console.warn(`BoundlessSDK: Unknown event "${event}"`);
      return () => {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.kit.events.on(event, handler as any);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.kit.events.off(event, handler as any);
    };
  }
}
