import React from "react";
import { useSDK } from "../../context/SDKContext";

export const WalletDetails: React.FC = () => {
  const { walletAddress, balance, assetBalances, refreshStatus } = useSDK();

  return (
    <div
      style={{
        background: "#f5f5f5",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div>
            <strong>Address:</strong> {walletAddress || "Not Connected"}
          </div>
          <div>
            <strong>Balance:</strong> {balance} (XLM)
            {assetBalances.map((a) => (
              <div
                key={a.symbol}
                style={{
                  marginLeft: "10px",
                  fontSize: "0.9em",
                  color: "#444",
                }}
              >
                + {a.balance} {a.symbol}
              </div>
            ))}
          </div>
        </div>
        <button onClick={refreshStatus}>Refresh</button>
      </div>
    </div>
  );
};
