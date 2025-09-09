import React, { useState } from "react";
import axios from "axios";

// Usage: <EscalateButton entity={wallet} caseId={caseId} riskScore={currentRisk} />
const EscalateButton = ({ entity, caseId, riskScore = 0 }) => {
  const [escalated, setEscalated] = useState(false);
  const [loading, setLoading] = useState(false);
  const backendUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
    ? import.meta.env.VITE_BACKEND_URL
    : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050');

  const handleEscalate = async () => {
    if (!entity || !caseId) {
      alert("Missing entity or caseId for escalation");
      return;
    }

    const confirmed = window.confirm(`Escalate entity ${entity}? This will notify the authority.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await axios.post(
        `${backendUrl}/api/escalation`,
        { entity, riskScore: Number(riskScore) || 0, caseId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success) {
        alert("✅ Escalation sent to authority");
        setEscalated(true);
      } else if (res.data?.sent === false) {
        alert(`ℹ️ Not escalated: ${res.data?.reason || 'Risk below threshold'}`);
      } else {
        alert("⚠️ Escalation attempted, check logs");
        setEscalated(true);
      }
    } catch (err) {
      console.error('Escalation error:', err);
      const msg = err?.response?.data?.error || err.message || 'Failed to escalate';
      alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded text-white disabled:opacity-60 ${
        escalated ? "bg-gray-500" : "bg-red-600 hover:bg-red-700"
      }`}
      onClick={handleEscalate}
      disabled={escalated || loading}
      title={escalated ? "Escalation already sent" : "Send escalation to authority"}
    >
      {loading ? "Escalating..." : escalated ? "Escalated" : "🚨 Escalate"}
    </button>
  );
};

export default EscalateButton;
