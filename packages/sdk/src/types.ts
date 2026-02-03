// Re-export upstream types the consuming app will need.
// Declare Boundless-specific types below.

// ── re-exports from smart-account-kit ──────────────────────────

export type {
  StorageAdapter,
  StoredCredential,
  StoredSession,
  CreateWalletResult,
  ConnectWalletResult,
  TransactionResult,
  AssembledTransaction,
  ExternalWalletAdapter,
  SelectedSigner,
  ContractSigner,
  ContextRule,
  ContextRuleType,
} from "smart-account-kit";

// ── Boundless SDK config ────────────────────────────────────────

export interface BoundlessSdkConfig {
  network: "mainnet" | "testnet";
  rpcUrl?: string;
  rpId: string;
  rpName: string;
  backendUrl: string;
  relayerProxyUrl?: string;
  storage?: import("smart-account-kit").StorageAdapter;
}

// ── connect / register results ──────────────────────────────────

export interface ConnectOptions {
  prompt?: boolean;
}

export interface ConnectResult {
  walletAddress: string; // C… contract ID
  credentialId: string;
  isNew: boolean;
}

// ── signAndSubmit result ────────────────────────────────────────

export interface SignAndSubmitResult {
  hash: string;
  success: boolean;
}

// ── recovery key ────────────────────────────────────────────────

export interface AddRecoveryKeyOptions {
  appName: string;
  userName: string;
  nickname?: string;
}

export interface RecoveryKeyResult {
  credentialId: string;
}

// ── events ──────────────────────────────────────────────────────

export type BoundlessEventName =
  | "walletConnected"
  | "walletDisconnected"
  | "credentialCreated"
  | "credentialDeleted"
  | "sessionExpired"
  | "transactionSigned"
  | "transactionSubmitted";

export type BoundlessEventHandler = (...args: unknown[]) => void;
