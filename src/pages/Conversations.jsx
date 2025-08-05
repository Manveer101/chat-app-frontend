import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Conversations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [convs, setConvs] = useState([]);   // [{peer, last_message, unread}]
  const [error, setError] = useState(null);

  // optional manual start
  const [newUser, setNewUser] = useState("");

  // Helper: extract “peer” username safely from any server shape
  const pickPeer = (row) =>
    row?.peer || row?.username || row?.other || row?.user || row?.target || "";

  const goThread = (uname) => {
    if (!uname) return;
    // cache recent usernames
    try {
      const rec = JSON.parse(localStorage.getItem("recent_peers") || "[]");
      const set = new Set([uname, ...rec]);
      localStorage.setItem("recent_peers", JSON.stringify([...set].slice(0, 20)));
    } catch {}
    navigate(`/thread/${encodeURIComponent(uname)}`);
  };

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("chat/conversations/");
      let list = Array.isArray(data) ? data : (data?.results || []);
      // Normalize to consistent shape
      list = list
        .map((row) => ({
          peer: pickPeer(row),
          last_message: row?.last_message || row?.last || row?.preview || "",
          unread: row?.unread ?? row?.unread_count ?? 0,
          updated_at: row?.updated_at || row?.last_time || row?.timestamp || null,
        }))
        .filter((x) => !!x.peer);

      setConvs(list);
      // also merge into recent cache (nice fallback)
      try {
        const rec = JSON.parse(localStorage.getItem("recent_peers") || "[]");
        const merged = [...new Set([...list.map((x) => x.peer), ...rec])].slice(0, 20);
        localStorage.setItem("recent_peers", JSON.stringify(merged));
      } catch {}
    } catch (err) {
      // Show clean error (avoid HTML dump)
      const ctype = err?.response?.headers?.["content-type"] || "";
      if (ctype.includes("text/html")) {
        setError("Request error: server error.");
      } else if (err?.response) {
        setError(`Request error: ${err.response.statusText || "failed"}`);
      } else {
        setError("Network error. Please check API URL/CORS.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const startChat = (e) => {
    e.preventDefault();
    const uname = newUser.trim();
    if (!uname) {
      setError("Please enter a username.");
      return;
    }
    goThread(uname);
  };

  // Fallback: show cached recents if API returns empty
  let display = convs;
  if (!loading && convs.length === 0) {
    try {
      const rec = JSON.parse(localStorage.getItem("recent_peers") || "[]");
      if (rec.length) {
        display = rec.map((p) => ({ peer: p, last_message: "", unread: 0 }));
      }
    } catch {}
  }

  return (
    
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white/90">Chat</h1>
      </div>

      {/* Optional start-new chat */}
      <form onSubmit={startChat} className="flex gap-2">
        <input
          value={newUser}
          onChange={(e) => setNewUser(e.target.value)}
          placeholder="Start chat with username …"
          className="flex-1 border rounded p-2 bg-transparent text-white/90 placeholder-white/50"
        />
        <button className="px-4 py-2 rounded bg-blue-600 text-white">Open</button>
      </form>

      {error && (
        <div className="p-2 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* List */}
      <div className="rounded border border-white/10 bg-white/5">
        {loading ? (
          <div className="p-4 text-white/70 text-sm">Loading…</div>
        ) : display.length === 0 ? (
          <div className="p-4 text-white/70 text-sm">No conversations yet.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {display.map((c, i) => (
              <li
                key={`${c.peer}-${i}`}
                className="p-3 hover:bg-white/10 cursor-pointer flex items-center justify-between"
                onClick={() => goThread(c.peer)}
              >
                <div>
                  <div className="font-medium text-white">{c.peer}</div>
                  {c.last_message ? (
                    <div className="text-xs text-white/60 line-clamp-1">{c.last_message}</div>
                  ) : null}
                </div>
                {c.unread > 0 ? (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {c.unread}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <button
          onClick={fetchConversations}
          className="text-sm px-3 py-1 rounded border border-white/10 text-white/80 hover:bg-white/10"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
