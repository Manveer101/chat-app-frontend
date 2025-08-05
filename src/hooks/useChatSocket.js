import { useEffect, useRef } from "react";

export default function useChatSocket({ otherUsername, onEvent }) {
  const ref = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token"); // if you add token auth via query
    // Base from your API URL; replace http -> ws, https -> wss
    const base = (import.meta.env.VITE_API_BASE_URL || "https://mychatapp-1-ooe6.onrender.com/api/")
                  .replace(/\/api\/?$/, ""); // drop /api/
    const wsUrl = base.replace(/^http/, "ws") + `/ws/chat/${encodeURIComponent(otherUsername)}/`;
    const ws = new WebSocket(wsUrl); // If you add token middleware, append ?token=...

    ref.current = ws;

    ws.onmessage = (e) => {
      try { onEvent && onEvent(JSON.parse(e.data)); }
      catch (_) {}
    };
    ws.onclose = () => { /* optional retry logic */ };

    return () => ws.close();
  }, [otherUsername, onEvent]);

  const send = (obj) => {
    if (ref.current?.readyState === 1) {
      ref.current.send(JSON.stringify(obj));
    }
  };

  return { send };
}
