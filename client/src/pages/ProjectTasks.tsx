import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const baseURL = "http://localhost:3000/projects";
const usersURL = "http://localhost:3000/users";

interface User {
  id: number;
  name?: string;
  email: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  dueDate?: string;
  assigneeId?: number;
  assigneeName?: string;
  projectId: number;
}

interface ProjectWithTasks {
  id: number;
  name: string;
  tasks: Task[];
}

export default function ProjectTasks() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectWithTasks | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProjectTasks(id);
    fetchUsers();
  }, [id]);

  const fetchProjectTasks = async (projectId: string) => {
    try {
      const response = await fetch(`${baseURL}/${projectId}/tasks`);
      if (!response.ok) throw new Error("Failed to fetch project tasks");
      const data: ProjectWithTasks = await response.json();
      setProject(data);
    } catch (err) {
      console.error(err);
      setProject({ id: parseInt(projectId), name: "", tasks: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(usersURL);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleCreateTaskClick = () => {
    setShowModal(true);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setTitle("");
    setDescription("");
    setStatus("todo");
    setAssigneeId("");
    setDueDate("");
    setError(null);
  };

  const handleTaskSubmit = async () => {
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    if (!id) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/projects/${id}/tasks/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            status,
            assigneeId: assigneeId || null,
            dueDate: dueDate || null,
            projectId: parseInt(id),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create task");
        setCreating(false);
        return;
      }

      const task: Task = await response.json();
      const user = users.find((u) => u.id === task.assigneeId);

      const updatedTask = {
        ...task,
        assigneeName: user ? user.name || user.email : undefined,
      };

      setProject((prev) =>
        prev
          ? { ...prev, tasks: [...(prev.tasks ?? []), updatedTask] }
          : prev
      );

      handleModalClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#ccc",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2>Tasks for Project {project?.name || id}</h2>
        <button
          onClick={handleCreateTaskClick}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + Create Task
        </button>
      </div>

      {(project?.tasks ?? []).length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {(project?.tasks ?? []).map((task) => (
            <li
              key={task.id}
              style={{
                padding: "0.75rem",
                marginBottom: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <strong>{task.title}</strong> - {task.status}
              {task.description && <p>{task.description}</p>}
              {task.assigneeName && <p>Assignee: {task.assigneeName}</p>}
              {task.dueDate && (
                <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
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
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h3 style={{ marginBottom: "1rem" }}>Create Task</h3>

            {error && (
              <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>
            )}

            <label>Title</label>
            <input
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
            />

            <label>Description</label>
            <textarea
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
            />

            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
            >
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <label>Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) =>
                setAssigneeId(e.target.value ? Number(e.target.value) : "")
              }
              style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
            >
              <option value="">Select Assignee</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>

            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button onClick={handleModalClose} style={{ padding: "0.5rem 1rem" }}>
                Cancel
              </button>
              <button
                onClick={handleTaskSubmit}
                disabled={creating}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: creating ? "not-allowed" : "pointer",
                  opacity: creating ? 0.6 : 1,
                }}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}