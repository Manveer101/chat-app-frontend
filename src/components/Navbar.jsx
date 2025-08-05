import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react"; // profile icon

export default function Navbar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <nav className="px-4 py-2 border-b flex items-center gap-4 bg-white">
      <Link to="/" className="font-semibold text-lg">Chattor</Link>

      <div className="ml-auto flex items-center gap-3">
        {username && (
          <>
            <span className="text-sm opacity-80 hidden sm:inline">Hi, {username}</span>
            <Link to="/profile" className="text-gray-700 hover:text-black">
              <User className="w-6 h-6" />
            </Link>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
            >
              Logout
            </button>
          </>
        )}

        {!username && (
          <Link
            to="/login"
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
