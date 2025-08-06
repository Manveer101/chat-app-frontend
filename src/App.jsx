import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Conversations from "./pages/Conversations.jsx";
import Thread from "./pages/Thread.jsx";
//import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Threads from "./pages/Thread.jsx";
import Profile from "./pages/Profile"; // adjust the path

function Protected({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Protected><Conversations /></Protected>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat/:username" element={<Protected><Thread /></Protected>} />
        
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/thread/:username" element={<Thread />} />

      </Routes>
    </BrowserRouter>
  );
}
