export const NETWORK_CONFIGS = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    defaultRpcUrl: "https://soroban-testnet.stellar.org",
    accountWasmHash:
      "a12e8fa9621efd20315753bd4007d974390e31fbcb4a7ddc4dd0a0dec728bf2e",
    webauthnVerifierAddress:
      "CBSHV66WG7UV6FQVUTB67P3DZUEJ2KJ5X6JKQH5MFRAAFNFJUAJVXJYV",
    ed25519VerifierAddress:
      "CDGMOL3BP6Y6LYOXXTRNXBNJ2SLNTQ47BGG3LOS2OBBE657E3NYCN54B",
    nativeTokenContract:
      "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    policies: {
      threshold: "CCT4MMN5MJ6O2OU6LXPYTCVORQ2QVTBMDJ7MYBZQ2ULSYQVUIYP4IFYD",
      spendingLimit: "CBMMWY54XOV6JJHSWCMKWWPXVRXASR5U26UJMLZDN4SP6CFFTVZARPTY",
      weightedThreshold:
        "CBYDQ5XUBP7G24FI3LLGLW56QZCIEUSVRPX7FVOUCKHJQQ6DTF6BQGBZ",
    },
    relayerUrl: "",
  },
  mainnet: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    defaultRpcUrl: "https://soroban-rpc.mainnet.stellar.org",
    accountWasmHash: "REPLACE_WITH_MAINNET_WASM_HASH",
    webauthnVerifierAddress: "REPLACE_WITH_MAINNET_VERIFIER",
    ed25519VerifierAddress: "REPLACE_WITH_MAINNET_VERIFIER",
    nativeTokenContract: "REPLACE_WITH_MAINNET_CONTRACT",
    policies: {
      threshold: "REPLACE_WITH_MAINNET_POLICY",
      spendingLimit: "REPLACE_WITH_MAINNET_POLICY",
      weightedThreshold: "REPLACE_WITH_MAINNET_POLICY",
    },
    relayerUrl: "",
  },
} as const;

export type NetworkName = keyof typeof NETWORK_CONFIGS;
