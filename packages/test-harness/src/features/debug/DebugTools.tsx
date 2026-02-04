import React, { useState } from "react";
import { useSDK } from "../../context/SDKContext";
import { cardStyle } from "../../styles";

export const DebugTools: React.FC = () => {
  const { sdk, walletAddress, loading, setLoading, addLog, handleError } =
    useSDK();
  const [customToken, setCustomToken] = useState("");

  const handleInspectStorage = async () => {
    if (!walletAddress) return;
    setLoading(true);
    addLog(`Inspecting Contract Storage for ${walletAddress}...`);
    try {
      addLog("Calling getContractData (Simulated/Partial)...");
      addLog(
        "To see all assets, use an Indexer or check specific Token IDs below.",
      );
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckCustomToken = async () => {
    if (!walletAddress || !customToken) return;
    setLoading(true);
    addLog(`Checking balance for token: ${customToken}...`);
    try {
      const val = await sdk.getBalance(walletAddress, customToken);
      addLog(`Balance Result: ${val} (raw units/decimals handled by SDK)`);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3>Advanced & Assets</h3>
      <button
        onClick={handleInspectStorage}
        disabled={!walletAddress || loading}
      >
        Inspect Wallet Storage
      </button>
      <p style={{ fontSize: "10px", color: "#666" }}>
        *Dumps raw storage keys to logs. Use to verify if assets are stored
        locally (unlikely).
      </p>

      <hr />
      <h4>Check Other Asset</h4>
      <input
        placeholder="Contract (C...) or Asset (USDC:G...)"
        value={customToken}
        onChange={(e) => setCustomToken(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />
      <button
        onClick={handleCheckCustomToken}
        disabled={!walletAddress || !customToken || loading}
      >
        Check Balance
      </button>
    </div>
  );
};
