import React from "react";
import { NETWORK_CONFIGS } from "@boundless/identity-sdk";
import { useSDK } from "../../context/SDKContext";

export const FundWallet: React.FC = () => {
  const {
    sdk,
    walletAddress,
    loading,
    setLoading,
    addLog,
    refreshStatus,
    handleError,
  } = useSDK();

  const handleFund = async () => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      addLog("Funding wallet (Testnet Friendbot)...");
      const kit = sdk.smartAccountKit;
      const res = await kit.fundWallet(
        NETWORK_CONFIGS.testnet.nativeTokenContract,
      );
      if (res.success) {
        addLog(`Funded! Hash: ${res.hash}`);
        refreshStatus();
      } else {
        addLog(`Fund failed: ${res.error}`);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: "10px" }}>
      <button onClick={handleFund} disabled={!walletAddress || loading}>
        {loading ? "..." : "Fund Wallet (Testnet)"}
      </button>
    </div>
  );
};
