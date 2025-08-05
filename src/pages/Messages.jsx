import { useEffect, useState } from "react";
import api from "../api";

export default function Messages({ token }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/chat/messages/", {
      headers: { Authorization: `Token ${token}` },
    })
      .then((res) => setItems(Array.isArray(res.data) ? res.data : (res.data.results || [])))
      .catch((err) => {
        console.error(err);
        alert("Failed to fetch messages");
      });
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <ul className="space-y-2">
        {items.map((m) => (
          <li key={m.id} className="bg-gray-100 p-3 rounded">
            <div><b>To:</b> {String(m.receiver)}</div>
            <div>{m.is_deleted ? <i>(deleted)</i> : m.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
