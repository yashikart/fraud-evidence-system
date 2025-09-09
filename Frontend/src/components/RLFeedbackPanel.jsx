import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const RLFeedbackPanel = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const wsRef = useRef(null);

  const backendUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
    ? import.meta.env.VITE_BACKEND_URL
    : (process.env.REACT_APP_BACKEND_URL || 'http://localhost:5050');

  const wsUrl = useMemo(() => {
    // If explicit WS URL is provided, use it
    const explicit = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL)
      ? import.meta.env.VITE_WS_URL
      : (process.env.REACT_APP_WS_URL || null);
    if (explicit) return explicit;

    try {
      // Derive WS URL from backend URL: http(s) -> ws(s), port + 1 if present
      const url = new URL(backendUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      let port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 5050);
      const derivedPort = (port || 5050) + 1; // server WS runs on API port + 1 by default
      return `${protocol}//${url.hostname}:${derivedPort}`;
    } catch {
      // Fallback
      return 'ws://localhost:5051';
    }
  }, [backendUrl]);

  // Fetch initial RL decisions (HTTP)
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/feedback/rl`);
        const list = Array.isArray(res.data) ? res.data : [];
        // Normalize _id to id for consistency
        setFeedbackData(list.map(x => ({ id: x._id || x.id, ...x })));
      } catch (err) {
        console.error("Failed to fetch RL feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [backendUrl]);

  // WebSocket live updates
  useEffect(() => {
    try {
      const sock = new WebSocket(wsUrl);
      wsRef.current = sock;

      sock.onopen = () => setWsStatus('connected');
      sock.onclose = () => setWsStatus('disconnected');
      sock.onerror = (e) => {
        console.warn('WS error', e);
        setWsStatus('error');
      };
      sock.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const { type, payload } = msg || {};

          // Normalize RL decision messages
          if (type === 'rlDecision' || type === 'rl_decision' || type === 'rl_update') {
            const item = payload || {};
            const id = item._id || item.id || item.decisionId || `${Date.now()}`;
            setFeedbackData(prev => {
              const idx = prev.findIndex(x => (x.id || x._id) === id);
              const normalized = { id, ...item };
              if (idx >= 0) {
                const next = prev.slice();
                next[idx] = { ...next[idx], ...normalized };
                return next;
              }
              // prepend new decisions
              return [normalized, ...prev].slice(0, 50);
            });
          }

          // Optionally show escalations in this panel for visibility
          if (type === 'escalation') {
            const item = payload || {};
            const id = item._id || item.id || `esc-${Date.now()}`;
            setFeedbackData(prev => {
              const entry = { id, wallet: item.entity, riskScore: item.riskScore, tags: ['escalation'], timestamp: new Date().toISOString() };
              return [entry, ...prev].slice(0, 50);
            });
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      return () => {
        try { sock.close(); } catch {}
      };
    } catch (e) {
      console.warn('Failed to open WebSocket:', e);
    }
  }, [wsUrl]);

  const sendFeedback = async (id, status) => {
    try {
      await axios.post(`${backendUrl}/api/feedback/rl`, {
        decisionId: id,
        feedback: status,
      });
      // Update local item
      setFeedbackData(prev => prev.map(item => (
        (item.id || item._id) === id
          ? { ...item, feedbackTrail: [...(item.feedbackTrail || []), { feedback: status, at: new Date().toISOString() }] }
          : item
      )));
      alert(`Feedback submitted: ${status}`);
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Failed to send feedback.");
    }
  };

  if (loading) return <div>Loading feedback...</div>;

  return (
    <div className="p-4 border rounded shadow-md bg-white mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🤖 RL Feedback Panel</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${
          wsStatus === 'connected' ? 'bg-green-100 text-green-700' : wsStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          WS: {wsStatus}
        </span>
      </div>

      {feedbackData.length === 0 ? (
        <div className="text-gray-500">No recent model decisions available.</div>
      ) : (
        <ul className="space-y-4">
          {feedbackData.map((item) => (
            <li key={item.id || item._id} className="border p-3 rounded-md">
              <p><strong>Wallet:</strong> {item.wallet || item.address || item.entity || 'N/A'}</p>
              <p><strong>Risk Score:</strong> {item.riskScore ?? 'N/A'} / 100</p>
              <p><strong>Confidence:</strong> {item.confidence ?? 'N/A'}%</p>
              <p><strong>Tags:</strong> {(item.tags || []).join(", ")}</p>
              {Array.isArray(item.feedbackTrail) && item.feedbackTrail.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Feedback trail: {item.feedbackTrail.map((f, idx) => `${f.feedback}@${new Date(f.at).toLocaleString()}`).join(' | ')}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => sendFeedback(item.id || item._id, "correct")}
                  className="bg-green-500 text-white px-3 py-1 rounded"
                >
                  ✅ Correct
                </button>
                <button
                  onClick={() => sendFeedback(item.id || item._id, "wrong")}
                  className="bg-red-500 text-white px-3 py-1 rounded"
                >
                  ❌ Wrong
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RLFeedbackPanel;
