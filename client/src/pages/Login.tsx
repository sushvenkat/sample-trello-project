import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const baseURL = "http://localhost:3000/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState<"red" | "green">("red");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${baseURL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: { token?: string; error?: string } = await res.json();

      if (!res.ok || data.error) {
        setMessage(`Login failed: ${data.error || "Invalid credentials"}`);
        setMessageColor("red");
      } else {
        // ✅ store token via context (handles localStorage + state)
        login(data.token!);

        setMessage("Login successful!");
        setMessageColor("green");

        // Clear fields
        setEmail("");
        setPassword("");

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      }
    } catch (err) {
      setMessage("Login failed: Network error");
      setMessageColor("red");
      console.error(err);

      setEmail("");
      setPassword("");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button type="submit" style={{ padding: "0.5rem 1rem" }}>
          Login
        </button>
      </form>

      {message && (
        <p style={{ color: messageColor, marginTop: "1rem" }}>
          {message}
        </p>
      )}
    </div>
  );
}