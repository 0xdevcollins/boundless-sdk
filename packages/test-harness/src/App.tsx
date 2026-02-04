import { SDKProvider } from "./context/SDKContext";
import { ConnectionManager } from "./features/connection/ConnectionManager";
import { WalletDetails } from "./features/wallet/WalletDetails";
import { FundWallet } from "./features/wallet/FundWallet";
import { SendAsset } from "./features/transfer/SendAsset";
import { DebugTools } from "./features/debug/DebugTools";
import { LogConsole } from "./features/logger/LogConsole";
import { cardStyle } from "./styles";

function AppContent() {
  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "sans-serif",
        margin: "0 auto",
      }}
    >
      <h1>Boundless Test Harness</h1>

      <WalletDetails />

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <ConnectionManager />

          <div style={cardStyle}>
            <h3>Wallet Actions</h3>
            <FundWallet />
            <SendAsset />
          </div>

          <DebugTools />
        </div>

        {/* Logs */}
        <LogConsole />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SDKProvider>
      <AppContent />
    </SDKProvider>
  );
}
