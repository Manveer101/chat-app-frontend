import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Signup() {
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("auth/signup/", form);
      alert("Signup successful. Please login.");
      navigate("/login");
    } catch (err) {
      if (err.response) setError(JSON.stringify(err.response.data));
      else setError("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">Create Account</h2>
        <input className="w-full border p-2 mb-3 rounded" placeholder="Username"
          value={form.username} onChange={(e)=>setForm({...form, username:e.target.value})}/>
        <input className="w-full border p-2 mb-3 rounded" placeholder="Email"
          value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})}/>
        <input className="w-full border p-2 mb-3 rounded" type="password" placeholder="Password"
          value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})}/>
        <input className="w-full border p-2 mb-4 rounded" type="password" placeholder="Confirm Password"
          value={form.password2} onChange={(e)=>setForm({...form, password2:e.target.value})}/>
        {error && <div className="text-red-600 text-sm mb-2 break-all">{error}</div>}
        <button className="w-full bg-blue-600 text-white py-2 rounded">Sign Up</button>
        <p className="text-sm mt-3">Already have an account? <Link className="text-blue-600" to="/login">Already have an account?</Link></p>
      </form>
    </div>
  );
}
