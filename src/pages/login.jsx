import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await api.post("auth/signin/", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username);
      navigate("/");
    } catch (err) {
      if (err.response) setError(`${err.response.status}: ${JSON.stringify(err.response.data)}`);
      else setError("Network/CORS error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Log In</h2>
        <input className="w-full border p-2 mb-3 rounded" placeholder="Username"
          value={username} onChange={(e)=>setUsername(e.target.value)} />
        <input className="w-full border p-2 mb-4 rounded" type="password" placeholder="Password"
          value={password} onChange={(e)=>setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm mb-2 break-all">{error}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        <p className="text-sm mt-3">New here? <Link className="text-blue-600" to="/signup">New Here? Create account</Link></p>
      </form>
    </div>
  );
}
