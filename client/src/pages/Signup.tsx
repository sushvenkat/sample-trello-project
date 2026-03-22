import { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- import useNavigate

const baseURL = "http://localhost:3000/auth"; // adjust your server URL

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState<"red" | "green">("red");

  const navigate = useNavigate(); // <-- hook for navigation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${baseURL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: { message?: string; error?: string } = await res.json();

      if (!res.ok || data.error) {
        setMessage(`Signup failed: ${data.error || "Unknown error"}`);
        setMessageColor("red");
      } else {
        setMessage("User created. Redirecting to login...");
        setMessageColor("green");

        // Clear form fields
        setEmail("");
        setPassword("");

        // Redirect after a short delay so the user can see the message
        setTimeout(() => {
          navigate("/login"); // <-- redirect to login page
        }, 1500);
      }

    } catch (err) {
      setMessage("Signup failed: Network error");
      setMessageColor("red");
      console.error(err);
      setEmail("");
      setPassword("");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "2rem auto" }}>
      <h2>Signup</h2>
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
          Signup
        </button>
      </form>
      {message && <p style={{ color: messageColor, marginTop: "1rem" }}>{message}</p>}
    </div>
  );
}