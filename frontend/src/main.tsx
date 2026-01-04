import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/* ===== Handle wallet account change ===== */
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => {
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);