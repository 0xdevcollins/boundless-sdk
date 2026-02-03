/**
 * Validate that a string looks like a Soroban contract address.
 * Soroban contract IDs start with 'C' and are 56 characters (StrKey).
 */
export function isValidContractAddress(addr: string): boolean {
  return typeof addr === "string" && addr.length === 56 && addr.startsWith("C");
}

/**
 * Validate that a string looks like a Stellar account address (G…).
 */
export function isValidStellarAddress(addr: string): boolean {
  return typeof addr === "string" && addr.length === 56 && addr.startsWith("G");
}

/**
 * Sleep for N milliseconds.  Useful in retry loops.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
