import React from "react";
import { cardStyle } from "../../styles";
import { useSDK } from "../../context/SDKContext";

export const ConnectionManager: React.FC = () => {
  const { sdk, walletAddress, addLog, refreshStatus, handleError } = useSDK();

  const handleConnect = async (prompt: boolean) => {
    try {
      addLog(prompt ? "Connecting (Prompt)..." : "Connecting (Silent)...");
      const res = await sdk.connect({ prompt });
      addLog(`Result: ${JSON.stringify(res)}`);
      refreshStatus();
    } catch (err) {
      handleError(err);
    }
  };

  const handleRegister = async () => {
    try {
      addLog("Registering...");
      const res = await sdk.register(`user-${Date.now()}@test.com`);
      addLog(`Registered: ${JSON.stringify(res)}`);
      refreshStatus();
    } catch (err) {
      handleError(err);
    }
  };

  const handleDisconnect = async () => {
    await sdk.disconnect();
    addLog("Disconnected");
    refreshStatus();
  };

  return (
    <div style={cardStyle}>
      <h3>Connection</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={() => handleConnect(false)} disabled={!!walletAddress}>
          Connect (Silent)
        </button>
        <button onClick={() => handleConnect(true)} disabled={!!walletAddress}>
          Connect (Prompt)
        </button>
        <button onClick={handleRegister} disabled={!!walletAddress}>
          Register New
        </button>
        <button onClick={handleDisconnect} disabled={!walletAddress}>
          Disconnect
        </button>
      </div>
    </div>
  );
};
