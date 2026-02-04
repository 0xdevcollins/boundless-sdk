import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { BoundlessSDK } from "@boundless/identity-sdk";

export const KNOWN_ASSETS = [
  {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  {
    code: "EURC",
    issuer: "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO",
  },
];

interface AssetBalance {
  symbol: string;
  balance: string;
}

interface SDKContextType {
  sdk: BoundlessSDK;
  logs: string[];
  addLog: (msg: string) => void;
  walletAddress: string | null;
  balance: string;
  assetBalances: AssetBalance[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  refreshStatus: () => Promise<void>;
  handleError: (error: unknown) => void;
}

const SDKContext = createContext<SDKContextType | null>(null);

export const useSDK = () => {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error("useSDK must be used within an SDKProvider");
  }
  return context;
};

// Initialize SDK outside component to avoid recreation
const sdkInstance = new BoundlessSDK({
  network: "testnet",
  rpId: window.location.hostname,
  rpName: "Boundless Test Harness",
  backendUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  relayerProxyUrl: import.meta.env.VITE_RELAYER_PROXY_URL,
});

export const SDKProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [assetBalances, setAssetBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    console.log(msg);
  }, []);

  const handleError = useCallback(
    (error: unknown) => {
      const msg = error instanceof Error ? error.message : String(error);
      addLog(`ERROR: ${msg}`);
    },
    [addLog],
  );

  const fetchBalance = useCallback(async (addr: string) => {
    if (!addr) return;
    try {
      // 1. Native Balance
      const xlmBalance = await sdkInstance.getBalance(addr, "XLM");
      setBalance(xlmBalance);

      // 2. Fetch Known Asset Balances
      const newAssetBalances: AssetBalance[] = [];

      for (const assetDef of KNOWN_ASSETS) {
        try {
          const b = await sdkInstance.getBalance(
            addr,
            assetDef.code,
            assetDef.issuer,
          );
          if (Number(b) > 0) {
            newAssetBalances.push({ symbol: assetDef.code, balance: b });
          }
        } catch (e) {
          console.log(`Failed to fetch ${assetDef.code}`, e);
        }
      }
      setAssetBalances(newAssetBalances);
    } catch (e) {
      console.error(e);
      setBalance("Error fetching balance");
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const addr = sdkInstance.getWalletAddress();
      setWalletAddress(addr);
      if (addr) {
        await fetchBalance(addr);
      } else {
        setBalance("0");
        setAssetBalances([]);
      }
    } catch (err) {
      handleError(err);
    }
  }, [fetchBalance, handleError]);

  useEffect(() => {
    // Event listeners
    const unsubConnected = sdkInstance.onEvent("walletConnected", (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addr = (data as any)?.walletAddress;
      addLog(`EVENT: walletConnected - ${addr}`);
      refreshStatus();
    });

    // Check initial status
    refreshStatus();

    return () => {
      unsubConnected();
    };
  }, [refreshStatus, addLog]);

  const value = {
    sdk: sdkInstance,
    logs,
    addLog,
    walletAddress,
    balance,
    assetBalances,
    loading,
    setLoading,
    refreshStatus,
    handleError,
  };

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
};
