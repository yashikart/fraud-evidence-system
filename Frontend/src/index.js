import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./App";
import AdminPage from "./Pages/AdminPage";
import InvestigatorDashboard from "./Pages/InvestigatorDashboard";
import PublicPage from "./Pages/PublicPage";
import PublicStatus from "./components/PublicStatus";
import ProtectedRoute from "./components/ProtectedRoute";

import "./index.css";
import "./styles/Button.css"; 

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/investigator" element={<InvestigatorDashboard />} />
        <Route path="/public" element={<PublicPage />} />
        <Route path="/status" element={<PublicStatus />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);