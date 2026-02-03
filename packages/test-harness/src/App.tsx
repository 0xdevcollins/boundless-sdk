import { useState, useEffect } from "react";
import { BoundlessSDK } from "@boundless/identity-sdk";

// Initialize SDK outside component to simulate singleton usage
const sdk = new BoundlessSDK({
  network: "testnet",
  rpId: window.location.hostname,
  rpName: "Boundless Test Harness",
  backendUrl: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
  relayerProxyUrl: import.meta.env.VITE_RELAYER_proxy_URL,
});

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    console.log(msg);
  };

  const handleError = (error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    addLog(`ERROR: ${msg}`);
  };

  useEffect(() => {
    // Subscribe to events
    const unsubEvents = sdk.onEvent("walletConnected", (data) =>
      addLog(`EVENT: walletConnected - ${JSON.stringify(data)}`),
    );
    sdk.onEvent("walletDisconnected", () =>
      addLog("EVENT: walletDisconnected"),
    );
    sdk.onEvent("transactionSigned", (data) =>
      addLog(`EVENT: transactionSigned - ${JSON.stringify(data)}`),
    );
    sdk.onEvent("transactionSubmitted", (data) =>
      addLog(`EVENT: transactionSubmitted - ${JSON.stringify(data)}`),
    );

    return () => {
      unsubEvents();
    };
  }, []);

  const refreshAddress = () => {
    try {
      const addr = sdk.getWalletAddress();
      setWalletAddress(addr);
      addLog(`Current Address: ${addr}`);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Boundless Identity SDK Test Harness</h1>

      <div
        style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0" }}
      >
        <strong>Status:</strong>{" "}
        {walletAddress ? `Connected (${walletAddress})` : "Disconnected"}
        <button onClick={refreshAddress} style={{ marginLeft: "10px" }}>
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        {/* Connect */}
        <div style={cardStyle}>
          <h3>Connect</h3>
          <button
            onClick={async () => {
              try {
                addLog("Connecting...");
                const res = await sdk.connect();
                addLog(`Connect Result: ${JSON.stringify(res, null, 2)}`);
                refreshAddress();
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Connect (Silent)
          </button>
          <div style={{ height: "10px" }} />
          <button
            onClick={async () => {
              try {
                addLog("Connecting with Prompt...");
                const res = await sdk.connect({ prompt: true });
                addLog(`Connect Result: ${JSON.stringify(res, null, 2)}`);
                refreshAddress();
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Connect (Force Prompt)
          </button>
        </div>

        {/* Register */}
        <div style={cardStyle}>
          <h3>Register</h3>
          <button
            onClick={async () => {
              try {
                addLog("Registering...");
                const res = await sdk.register("test@test.com");
                addLog(`Register Result: ${JSON.stringify(res, null, 2)}`);
                refreshAddress();
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Register ('test@test.com')
          </button>
          <p style={{ fontSize: "12px" }}>
            Requires active Better-Auth session!
          </p>
        </div>

        {/* Sign & Submit */}
        <div style={cardStyle}>
          <h3>Sign & Submit</h3>
          <button
            onClick={async () => {
              try {
                addLog(
                  "Building Dummy Transaction (not implemented in harness fully)...",
                );
                // To do a real test, we need a valid transaction.
                // For now, we just log that we would pass a transaction here.
                addLog("This requires an AssembledTransaction object.");
                // sdk.signAndSubmit(tx)
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Sign Transfer (Dummy)
          </button>
        </div>

        {/* Recovery Key */}
        <div style={cardStyle}>
          <h3>Add Recovery Key</h3>
          <button
            onClick={async () => {
              try {
                addLog("Adding Recovery Key...");
                const res = await sdk.addRecoveryKey({
                  appName: "Boundless Recovery",
                  userName: "Recovery Device",
                  nickname: "Harness Backup",
                });
                addLog(`Recovery Key Added: ${JSON.stringify(res)}`);
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Add Key
          </button>
        </div>

        {/* Remove Credential */}
        <div style={cardStyle}>
          <h3>Remove Credential</h3>
          <button
            onClick={async () => {
              const id = prompt("Enter Credential ID to remove:");
              if (!id) return;
              try {
                addLog(`Removing credential ${id}...`);
                await sdk.removeCredential(id);
                addLog("Credential removed.");
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Remove Credential
          </button>
        </div>

        {/* Disconnect */}
        <div style={cardStyle}>
          <h3>Disconnect</h3>
          <button
            onClick={async () => {
              try {
                addLog("Disconnecting...");
                await sdk.disconnect();
                addLog("Disconnected.");
                refreshAddress();
              } catch (err) {
                handleError(err);
              }
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "30px",
          borderTop: "1px solid #ccc",
          paddingTop: "10px",
        }}
      >
        <h3>Logs</h3>
        <div
          style={{
            background: "#000",
            color: "#0f0",
            padding: "10px",
            height: "300px",
            overflowY: "scroll",
            fontFamily: "monospace",
          }}
        >
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  border: "1px solid #ddd",
  padding: "15px",
  borderRadius: "8px",
  background: "#fff",
};

export default App;
