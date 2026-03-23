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
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Create Project
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Project
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchProjects();
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await fetch(baseURL);
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data: Project[] = await response.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjects(false);
    }
  };

  /** Logout */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /** CREATE PROJECT **/
  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => {
    setShowCreateModal(false);
    setProjectName("");
    setProjectDescription("");
    setCreateError(null);
  };
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setCreateError("Project name is required");
      return;
    }
    setCreatingProject(true);
    setCreateError(null);

    try {
      const res = await fetch(`${baseURL}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Failed to create project");
        return;
      }
      const newProject: Project = await res.json();
      setProjects((prev) => [...prev, newProject]);
      closeCreateModal();
    } catch (err) {
      console.error(err);
      setCreateError("Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  };

  /** DELETE PROJECT **/
  const openDeleteModal = () => setShowDeleteModal(true);
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProjectId(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProjectId) return;
    setDeletingProject(true);
    try {
      const res = await fetch(`${baseURL}/${selectedProjectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      setProjects((prev) => prev.filter((p) => p.id !== selectedProjectId));
      closeDeleteModal();
    } catch (err) {
      console.error(err);
      alert("Failed to delete project");
    } finally {
      setDeletingProject(false);
    }
  };

  /** Navigate to project tasks */
  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="dashboard-container">
      {/* Top Bar */}
      <div className="dashboard-topbar">
        <h2>Dashboard</h2>
        {isAuthenticated && (
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>

      {/* Action Buttons */}
      {isAuthenticated && (
        <div className="dashboard-actions">
          <button className="btn-primary" onClick={openCreateModal}>
            + Create Project
          </button>
          <button
            className="btn-danger"
            onClick={openDeleteModal}
            disabled={projects.length === 0} // enable if projects exist
          >
            Delete Project
          </button>
        </div>
      )}

      {/* Projects */}
      {loadingProjects ? (
        <p>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleProjectClick(project.id)}
            >
              <strong>{project.name}</strong>
              {project.description && <p>{project.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Create Project</h3>
            {createError && <p className="error-text">{createError}</p>}
            <label>Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
            />
            <label>Description</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeCreateModal}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateProject}
                disabled={creatingProject}
              >
                {creatingProject ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Delete Project</h3>
            <p>Select a project to delete:</p>
            <select
              className="project-select"
              value={selectedProjectId ?? ""}
              onChange={(e) =>
                setSelectedProjectId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={!selectedProjectId || deletingProject}
              >
                {deletingProject ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .dashboard-container { max-width: 700px; margin: 2rem auto; padding: 2rem; border-radius: 12px; background: #f8f9fa; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .dashboard-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .dashboard-actions { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .btn-primary { background-color: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
        .btn-danger { background-color: #ef4444; color: white; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
        .btn-secondary { background-color: #e5e7eb; color: #111827; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
        .btn-logout { background-color: #6b7280; color: white; padding: 0.5rem 1rem; border-radius: 6px; border: none; cursor: pointer; }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .project-card { background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s; }
        .project-card:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .modal-backdrop { position: fixed; top:0; left:0; width:100vw; height:100vh; background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:1000; }
        .modal-card { background:white; padding:2rem; border-radius:12px; width:90%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.15); }
        .modal-card input, .modal-card textarea, .project-select { width: 100%; padding:0.5rem; margin:0.5rem 0 1rem; border:1px solid #ccc; border-radius:6px; }
        .modal-card input:focus, .modal-card textarea:focus, .project-select:focus { border-color:#2563eb; outline:none; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
        .modal-actions { display:flex; justify-content:flex-end; gap:0.5rem; }
        .error-text { color: #ef4444; }
      `}</style>
    </div>
  );
}