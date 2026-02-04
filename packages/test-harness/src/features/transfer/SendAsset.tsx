import React, { useState } from "react";
import { KNOWN_ASSETS, useSDK } from "../../context/SDKContext";

export const SendAsset: React.FC = () => {
  const {
    sdk,
    walletAddress,
    loading,
    setLoading,
    addLog,
    refreshStatus,
    handleError,
  } = useSDK();
  const [sendDest, setSendDest] = useState("");
  const [sendAmount, setSendAmount] = useState("10");
  const [sendAsset, setSendAsset] = useState("XLM");

  const handleSend = async () => {
    if (!walletAddress || !sendDest || !sendAmount) return;
    setLoading(true);
    try {
      addLog(`Sending ${sendAmount} ${sendAsset} to ${sendDest}...`);
      let assetIssuer: string | undefined;

      // Determine contract ID or issuer based on selected asset
      if (sendAsset !== "XLM") {
        const assetDef = KNOWN_ASSETS.find((a) => a.code === sendAsset);
        if (assetDef) {
          assetIssuer = assetDef.issuer;
        }
      }

      const res = await sdk.transfer(
        sendDest,
        sendAmount,
        sendAsset,
        assetIssuer,
      );

      if (res.success) {
        addLog(`Sent! Hash: ${res.hash}`);
        refreshStatus();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addLog(
          `Send failed: ${"error" in res ? (res as any).error : "Unknown error"}`,
        );
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <hr />
      <h4>Send {sendAsset}</h4>
      <select
        value={sendAsset}
        onChange={(e) => setSendAsset(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      >
        <option value="XLM">XLM (Native)</option>
        {KNOWN_ASSETS.map((a) => (
          <option key={a.code} value={a.code}>
            {a.code}
          </option>
        ))}
      </select>
      <input
        placeholder="Recipient Address"
        value={sendDest}
        onChange={(e) => setSendDest(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />
      <input
        placeholder="Amount"
        value={sendAmount}
        onChange={(e) => setSendAmount(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />
      <button onClick={handleSend} disabled={!walletAddress || loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
};
