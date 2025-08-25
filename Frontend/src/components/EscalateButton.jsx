import React, { useState } from "react";
import axios from "axios";

const EscalateButton = ({ entityId }) => {
  const [escalated, setEscalated] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEscalate = async () => {
    const confirm = window.confirm(`Are you sure you want to escalate ${entityId}?`);
    if (!confirm) return;

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/admin/escalate`, {
        wallet: entityId,
      });

      alert("✅ Escalation triggered!");
      setEscalated(true);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to escalate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`px-4 py-2 rounded text-white ${
        escalated ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
      }`}
      onClick={handleEscalate}
      disabled={escalated || loading}
    >
      {loading ? "Escalating..." : escalated ? "Escalated" : "🚨 Escalate"}
    </button>
  );
};

export default EscalateButton;
