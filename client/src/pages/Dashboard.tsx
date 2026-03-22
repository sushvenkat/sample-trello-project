import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const baseURL = "http://localhost:3000/projects";

interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    if (isAuthenticated) fetchProjects();
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(baseURL);
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateProjectClick = () => setShowModal(true);

  const handleModalClose = () => {
    setShowModal(false);
    setProjectName("");
    setProjectDescription("");
    setError(null);
  };

  const handleProjectSubmit = async () => {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseURL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create project");
        setLoading(false);
        return;
      }

      const project: Project = await response.json();
      handleModalClose();
      setProjects((prev) => [...prev, project]);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create project");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        position: "relative",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ margin: 0 }}>Dashboard</h2>

        {isAuthenticated && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleCreateProjectClick}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              + Create Project
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Projects */}
      {isAuthenticated && projects.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {projects.map((project) => (
            <li
              key={project.id}
              onClick={() => handleProjectClick(project)}
              style={{
                padding: "1rem",
                marginBottom: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <strong>{project.name}</strong>
              {project.description && <p>{project.description}</p>}
            </li>
          ))}
        </ul>
      ) : isAuthenticated ? (
        <p>No projects found.</p>
      ) : (
        <p style={{ color: "red", textAlign: "center" }}>Not authenticated</p>
      )}

      {/* Modal (Create Project) */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>Create Project</h3>

            {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

            <div style={{ marginBottom: "1rem" }}>
              <label>Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label>Description</label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  marginTop: "0.25rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}
            >
              <button
                onClick={handleModalClose}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ccc",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleProjectSubmit}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}