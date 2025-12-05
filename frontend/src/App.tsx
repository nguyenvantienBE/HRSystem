// src/App.tsx
import React from "react";
import { AuthProvider } from "./auth/AuthContext";
import AppRouter from "./router/AppRouter";
import "./index.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
