import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

export default function Thread() {
  const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
  const [file, setFile] = useState(null); // add this
  const { username } = useParams();
  const me = localStorage.getItem("username") || "";
  const token = localStorage.getItem("token") || "";

  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [userExists, setUserExists] = useState(true);
  const [typing, setTyping] = useState(null);

  // pagination / infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Refs
  const listRef = useRef(null);     // scrollable container
  const topRef = useRef(null);      // sentinel (top)
  const wsRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const ioRef = useRef(null);       // IntersectionObserver instance

  // Read calls de-dup
  const readInFlight = useRef(new Set());

  // Edit/Delete
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [busyId, setBusyId] = useState(null);

  // WS base
  const wsBase = (import.meta.env.VITE_API_BASE_URL || "https://r48hnsfc-8000.inc1.devtunnels.ms/api/")
    .replace(/\/api\/?$/, "")
    .replace(/^http/, "ws");

  // ---------- utils ----------
  const isAtBottom = () => {
    const node = listRef.current;
    if (!node) return true;
    return node.scrollHeight - (node.scrollTop + node.clientHeight) < 120;
  };

  const scrollToBottom = (smooth = true) => {
    const node = listRef.current;
    if (!node) return;
    const to = node.scrollHeight - node.clientHeight;
    node.scrollTo({ top: to, behavior: smooth ? "smooth" : "auto" });
  };

  const friendlyError = (err, fallback = "Something went wrong") => {
    try {
      if (err?.response) {
        const ctype = err.response?.headers?.["content-type"] || "";
        if (ctype.includes("text/html")) return `Error ${err.response.status}: Server error`;
        return `Error ${err.response.status} ${JSON.stringify(err.response.data)}`;
      }
      return "Network error. Please check API URL/CORS.";
    } catch {
      return fallback;
    }
  };

  const sortAsc = (arr) =>
    arr.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const appendUniqueAtEnd = (prev, newList) => {
    const ids = new Set(prev.map((m) => m.id));
    const onlyNew = newList.filter((m) => !ids.has(m.id));
    return [...prev, ...onlyNew];
  };

  const prependUniqueAtTop = (prev, olderList) => {
    const ids = new Set(prev.map((m) => m.id));
    const onlyOlder = olderList.filter((m) => !ids.has(m.id));
    return [...onlyOlder, ...prev];
  };

  // ---------- WebSocket ----------
  const openSocket = useCallback(() => {
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const url = `${wsBase}/ws/chat/${encodeURIComponent(username)}/${qs}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);

          if (data.type === "typing") {
            if (data.user && data.user !== me) {
              setTyping(`${data.user} is typing…`);
              window.clearTimeout(typingTimerRef.current);
              typingTimerRef.current = window.setTimeout(() => setTyping(null), 1200);
            }
            return;
          }

          // other side sent a new message
          if (data.event === "message" && data.message) {
            const atBottom = isAtBottom();
            setItems((prev) => appendUniqueAtEnd(prev, [data.message]));
            if (atBottom) setTimeout(() => scrollToBottom(true), 0);
            // Mark it read (since it's received by me)
            if (String(data.message.receiver) === me && !data.message.read_at) {
              markRead(data.message.id);
            }
            return;
          }

          // my message got read by other side
          if (data.event === "read" && data.id) {
            setItems((prev) =>
              prev.map((m) => (m.id === data.id ? { ...m, read_at: data.read_at } : m))
            );
            return;
          }
        } catch {
          /* ignore bad WS frames */
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    } catch {
      // ignore WS open errors
    }
  }, [username, wsBase, token, me]);

  const sendWs = useCallback((payload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  // ---------- Read helpers ----------
  const markRead = useCallback(
    async (id) => {
      if (!id) return;
      if (readInFlight.current.has(id)) return;
      readInFlight.current.add(id);
      try {
        await api.post(`chat/messages/${id}/read/`);
        // locally also set read_at, so UI updates immediately
        const ts = new Date().toISOString();
        setItems((prev) =>
          prev.map((m) => (m.id === id ? { ...m, read_at: m.read_at || ts } : m))
        );
      } catch {
        // ignore small errors, we can retry on next render/scroll
      } finally {
        readInFlight.current.delete(id);
      }
    },
    []
  );

  // ---------- Fetch helpers ----------
  const fetchPage = useCallback(
    async (p) => {
      const url = `chat/thread/${encodeURIComponent(username)}/?page=${p}`;
      const { data } = await api.get(url);
      let list, next;
      if (Array.isArray(data)) {
        list = data;
        next = null;
      } else {
        list = data.results || [];
        next = data.next || null;
      }
      return { list: sortAsc(list), next };
    },
    [username]
  );

  const loadInitial = useCallback(async () => {
    try {
      const { list, next } = await fetchPage(1);
      setItems(list);
      setHasMore(Boolean(next));
      setPage(1);
      setError(null);
      setUserExists(true);
      setTimeout(() => scrollToBottom(false), 0);
    } catch (err) {
      if (err?.response?.status === 404) {
        setUserExists(false);
        setError("User not found. Please check the username.");
      } else {
        setError(friendlyError(err));
      }
    }
  }, [fetchPage]);

  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingOlder) return;
    try {
      setLoadingOlder(true);
      const node = listRef.current;
      const prevH = node ? node.scrollHeight : 0;
      const prevTop = node ? node.scrollTop : 0;

      const nextPage = page + 1;
      const { list, next } = await fetchPage(nextPage);

      setItems((prev) => prependUniqueAtTop(prev, list));
      setHasMore(Boolean(next));
      setPage(nextPage);

      // preserve viewport
      setTimeout(() => {
        if (!node) return;
        const newH = node.scrollHeight;
        node.scrollTop = newH - prevH + prevTop;
      }, 0);
    } catch (err) {
      setError(friendlyError(err, "Failed to load older messages"));
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, page, fetchPage]);

  const refreshLatestMerge = useCallback(async () => {
    try {
      const atBottom = isAtBottom();
      const { list } = await fetchPage(1);
      setItems((prev) => appendUniqueAtEnd(prev, list));
      if (atBottom) setTimeout(() => scrollToBottom(true), 0);
    } catch {
      /* ignore */
    }
  }, [fetchPage]);




  
  const reactToMessage = async (id, emoji) => {
    try {
      await api.post(`chat/messages/${id}/react/`, { emoji });
      refreshLatestMerge(); // to get updated reactions
    } catch (err) {
      setError("Failed to react");
    }
  };
// ---------- Send message (always scroll bottom) ----------
const send = async (e) => {
  e.preventDefault();
  if (!userExists || (!text.trim() && !file)) return;

  const formData = new FormData();
  if (text.trim()) formData.append("content", text.trim());
  if (file) formData.append("file", file);

  try {
    const res = await api.post(`chat/thread/${encodeURIComponent(username)}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setText("");
    setFile(null);

    const created = res?.data && (res.data.id || res.data.timestamp) ? res.data : null;
    if (created) {
      setItems((prev) => appendUniqueAtEnd(prev, [created]));
    } else {
      await refreshLatestMerge();
    }

    sendWs({ type: "message", content: text });

    setTimeout(() => scrollToBottom(true), 0);
  } catch (err) {
    if (err?.response?.status === 404) {
      setUserExists(false);
      setError("Cannot send: user does not exist.");
    } else {
      setError(friendlyError(err, "Send failed"));
    }
  }
};
   

  // typing
  const onType = () => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > 800) {
      lastTypingSentRef.current = now;
      sendWs({ type: "typing" });
    }
  };

  // ---------- Edit/Delete ----------
  const startEdit = (msg) => {
    setEditingId(msg.id);
    setEditText(msg.content || "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editText.trim()) return;
    try {
      setBusyId(editingId);
      await api.patch(`chat/messages/${editingId}/edit/`, { content: editText.trim() });
      setItems((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, content: editText.trim(), is_edited: true } : m
        )
      );
      setEditingId(null);
      setEditText("");
    } catch (err) {
      setError(friendlyError(err, "Edit failed"));
    } finally {
      setBusyId(null);
    }
  };

  const deleteMsg = async (id) => {
    if (!confirm("Delete this message?")) return;
    try {
      setBusyId(id);
      await api.delete(`chat/messages/${id}/delete/`);
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, is_deleted: true, content: "" } : m)));
    } catch (err) {
      setError(friendlyError(err, "Delete failed"));
    } finally {
      setBusyId(null);
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    setError(null);
    setUserExists(true);
    loadInitial();
    openSocket();
    return () => {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      window.clearTimeout(typingTimerRef.current);
      if (ioRef.current) {
        ioRef.current.disconnect?.();
        ioRef.current = null;
      }
    };
  }, [username, loadInitial, openSocket]);

  // Top sentinel observer (load older)
  useEffect(() => {
    const node = topRef.current;
    const rootNode = listRef.current;
    if (!node || !rootNode) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadOlder();
        });
      },
      { root: rootNode, threshold: 0.1 }
    );

    io.observe(node);
    ioRef.current = io;
    return () => {
      io.disconnect();
      ioRef.current = null;
    };
  }, [loadOlder]);

  // ✅ Mark RECEIVED & UNREAD messages as READ (whenever items change)
  useEffect(() => {
    if (!items?.length) return;
    const toMark = items.filter((m) => String(m.receiver) === me && !m.read_at);
    toMark.forEach((m) => markRead(m.id));
  }, [items, me, markRead]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-sm text-blue-600">← Back</Link>
        <h2 className="text-xl font-bold text-black">Chat with {username}</h2>
      </div>

      {typing && <div className="text-sm text-black">{typing}</div>}

      {error && (
        <div className="p-2 rounded bg-red-100 text-black text-sm">
          {error}
        </div>
      )}

      {!userExists ? (
        <div className="p-3 rounded bg-yellow-50 border text-black">
          This user does not exist. Please go back and choose a valid username.
        </div>
      ) : (
        <>
          {/* Scrollable message list */}
          <div
            ref={listRef}
            className="space-y-2 h-[70vh] overflow-y-auto pr-1 border rounded p-2 bg-white"
          >
            {/* Top sentinel line */}
            <div ref={topRef} />

            {loadingOlder && hasMore && (
              <div className="text-center text-xs text-black py-1">Loading older…</div>
            )}

            {items.map((m) => {
              const mine = String(m.sender) === me;
              const edited = m.is_edited && !m.is_deleted;
              const isEditing = editingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`p-2 rounded ${mine ? "bg-blue-100" : "bg-gray-100"}`}
                >
                  <div className="text-xs text-black">
                    {mine ? "You" : m.sender} • {new Date(m.timestamp).toLocaleString()}
                  </div>

                  
                <div className="mt-1 flex flex-wrap gap-1">
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(m.id, emoji)}
                      className="text-sm hover:scale-110 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {m.reactions?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {m.reactions.map((r, i) => (
                      <span key={i} className="text-sm px-2 py-1 bg-gray-200 rounded">
                        {r}
                      </span>
                    ))}
                  </div>
                )}
<div className="mt-1 text-black">
                    {m.is_deleted ? (
                      <i>(This message was deleted)</i>
                    ) : isEditing ? (
                      <div className="flex gap-2 items-center">
                        <input
                          className="flex-1 border rounded p-1"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Edit message..."
                        />
                        <button
                          onClick={saveEdit}
                          disabled={busyId === m.id}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-black">{m.content}</div>
                        {edited ? <span className="text-xs text-black"> • edited</span> : null}
                      </>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    {mine && !m.is_deleted ? (
                      <div className="text-[11px] text-black">
                        {m.read_at ? "Seen" : "Sent"}
                      </div>
                    ) : <div />}

                    {mine && !m.is_deleted && !isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setEditText(m.content || "");
                          }}
                          disabled={busyId === m.id}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMsg(m.id)}
                          disabled={busyId === m.id}
                          className="px-2 py-1 border rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={send} className="flex gap-2 mt-2">
            <input
              className="flex-1 border rounded p-2 text-black"
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onInput={() => {
                const now = Date.now();
                if (now - lastTypingSentRef.current > 800) {
                  lastTypingSentRef.current = now;
                  sendWs({ type: "typing" });
                }
              }}
              disabled={!userExists}
            />
            
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-sm"
            />
            {file && (
              <div className="text-xs text-black mt-1">
                Selected: {file.name}
                <button onClick={() => setFile(null)} className="ml-2 text-red-600">
                  [remove]
                </button>
              </div>
            )}
            <button className="px-4 bg-blue-600 text-white rounded" disabled={!userExists}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
