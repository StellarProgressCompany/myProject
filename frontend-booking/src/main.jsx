// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // or "./main.css" — your Tailwind file

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
