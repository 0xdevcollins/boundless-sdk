import React from "react";
import { useSDK } from "../../context/SDKContext";
import { cardStyle } from "../../styles";

export const LogConsole: React.FC = () => {
  const { logs } = useSDK();

  return (
    <div style={cardStyle}>
      <h3>Logs</h3>
      <div
        style={{
          background: "#1e1e1e",
          color: "#0f0",
          fontFamily: "monospace",
          padding: "10px",
          height: "400px",
          overflowY: "auto",
          fontSize: "12px",
        }}
      >
        {logs.map((L, i) => (
          <div key={i}>{L}</div>
        ))}
      </div>
    </div>
  );
};
