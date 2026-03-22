import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout(); // clears localStorage + updates state
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto", textAlign: "center" }}>
      <h2>Dashboard</h2>

      {isAuthenticated ? (
        <>
          <p style={{ color: "green" }}>You are logged in ✅</p>

          <button
            onClick={handleLogout}
            style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}
          >
            Logout
          </button>
        </>
      ) : (
        <p style={{ color: "red" }}>Not authenticated</p>
      )}
    </div>
  );
}