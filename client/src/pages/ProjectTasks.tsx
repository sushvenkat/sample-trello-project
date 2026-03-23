import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";

const baseURL = "http://localhost:3000/projects";
const userURL = "http://localhost:3000/users";

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  assigneeId?: number | null;
  assigneeName: string;
}

interface UserWithTasks {
  user: { id: number | null; name: string; email?: string };
  tasks: Task[];
}

export default function ProjectTasks() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [groupedTasks, setGroupedTasks] = useState<UserWithTasks[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in-progress" | "done">("todo");
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statuses: ("todo" | "in-progress" | "done")[] = ["todo", "in-progress", "done"];

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch tasks
  const fetchTasks = async (projectId: string) => {
    try {
      const res = await fetch(`${baseURL}/${projectId}/users-with-tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data: UserWithTasks[] = await res.json();

      const normalized = data.map((g) => ({
        user: g.user,
        tasks: g.tasks.map((t) => {
          let st = t.status.toLowerCase().replace("_", "-");
          if (st === "inprogress") st = "in-progress";
          else if (!["todo", "in-progress", "done"].includes(st)) st = "todo";
          return { ...t, status: st };
        }),
      }));

      setGroupedTasks(normalized);
    } catch (err) {
      console.error(err);
      setGroupedTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${userURL}/`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  // WebSocket setup with auto-reconnect
  useEffect(() => {
    if (!id) return;
    fetchTasks(id);
    fetchUsers();

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWS = () => {
      ws = new WebSocket(`ws://localhost:3000/projects/${id}/ws`);
      wsRef.current = ws;

      ws.onopen = () => console.log("WebSocket connected");
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "TASKS_UPDATED") fetchTasks(id);
      };
      ws.onerror = (err) => console.error("WebSocket error:", err);
      ws.onclose = () => {
        console.log("WebSocket disconnected. Reconnecting in 2s...");
        reconnectTimeout = setTimeout(connectWS, 2000);
      };
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimeout);
      ws.close();
    };
  }, [id]);

  const openModal = () => {
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setTitle("");
    setDescription("");
    setStatus("todo");
    setAssigneeId("");
    setDueDate("");
    setError(null);
  };

  const handleTaskSubmit = async () => {
    if (!title.trim()) return setError("Task title is required");
    if (!id) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch(`${baseURL}/${id}/tasks/create`, {
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
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to create task");
        setCreating(false);
        return;
      }

      closeModal();
    } catch (err) {
      console.error(err);
      setError("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  // Handle drag and drop with optimistic update
  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || !id) return;

    const [sourceUserId, ...sourceStatusParts] = source.droppableId.split("-");
    const sourceStatus = sourceStatusParts.join("-");
    const [destUserId, ...destStatusParts] = destination.droppableId.split("-");
    const destStatus = destStatusParts.join("-");

    const taskId = parseInt(draggableId);

    setGroupedTasks((prev) => {
      const newState = structuredClone(prev);

      const sourceGroup = newState.find((g) => String(g.user.id) === sourceUserId);
      const destGroup = newState.find((g) => String(g.user.id) === destUserId);
      if (!sourceGroup || !destGroup) return prev;

      const taskIndex = sourceGroup.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return prev;

      const [task] = sourceGroup.tasks.splice(taskIndex, 1);

      const updatedTask: Task = {
        ...task,
        status: destStatus,
        assigneeId: destGroup.user.id,
        assigneeName: destGroup.user.name,
      };

      const destTasks = destGroup.tasks;
      const sameStatusTasks = destTasks.filter((t) => t.status === destStatus);

      let realIndex: number;
      if (sameStatusTasks.length === 0) realIndex = destTasks.length;
      else if (destination.index === 0)
        realIndex = destTasks.findIndex((t) => t.id === sameStatusTasks[0].id);
      else
        realIndex =
          destTasks.findIndex((t) => t.id === sameStatusTasks[destination.index - 1].id) + 1;

      destTasks.splice(realIndex, 0, updatedTask);

      // Send update to backend
      fetch(`${baseURL}/${id}/tasks/${taskId}/update-task`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: destStatus, assigneeId: destGroup.user.id }),
      }).catch(console.error);

      return newState;
    });
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: "0.5rem 1rem", backgroundColor: "#ccc", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          ← Back
        </button>
        <h2>Project Tasks</h2>
        <button
          onClick={openModal}
          style={{ padding: "0.5rem 1rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          + Create Task
        </button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "grid", gridTemplateColumns: `200px repeat(${statuses.length}, 1fr)`, gap: 10 }}>
          <div></div>
          {statuses.map((s) => (
            <div key={s} style={{ textAlign: "center", fontWeight: "bold", padding: 8, borderBottom: "2px solid #333" }}>
              {s.replace("-", " ")}
            </div>
          ))}

          {groupedTasks.map(({ user, tasks }) => (
            <React.Fragment key={user.id ?? user.name}>
              <div style={{ padding: 8, fontWeight: "bold", borderRight: "2px solid #ccc", backgroundColor: "#f9f9f9" }}>
                {user.name}
              </div>
              {statuses.map((s) => {
                const filtered = tasks.filter((t) => t.status === s);
                return (
                  <Droppable droppableId={`${user.id}-${s}`} key={`${user.id}-${s}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          minHeight: 50,
                          padding: 5,
                          backgroundColor: snapshot.isDraggingOver ? "#f0f0f0" : undefined,
                          borderRadius: 6,
                        }}
                      >
                        {filtered.map((t, index) => (
                          <Draggable draggableId={t.id.toString()} index={index} key={t.id}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  marginBottom: 5,
                                  padding: 8,
                                  borderRadius: 6,
                                  backgroundColor:
                                    s === "todo" ? "#fef3c7" : s === "in-progress" ? "#bfdbfe" : "#bbf7d0",
                                  boxShadow: snapshot.isDragging ? "0 2px 6px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <strong>{t.title}</strong>
                                {t.description && <div style={{ fontSize: "0.9em" }}>{t.description}</div>}
                                {t.dueDate && <div style={{ fontSize: "0.8em", marginTop: 2 }}>Due: {new Date(t.dueDate).toLocaleDateString()}</div>}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {filtered.length === 0 && <div style={{ color: "#999", fontSize: "0.8em" }}>—</div>}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
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
            zIndex: 9999,
          }}
        >
          <div style={{ backgroundColor: "white", padding: 24, borderRadius: 8, width: 400, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ marginBottom: 16 }}>Create Task</h3>
            {error && <p style={{ color: "red", marginBottom: 16 }}>{error}</p>}

            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" style={{ width: "100%", padding: 8, marginBottom: 16 }} />

            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task description" style={{ width: "100%", padding: 8, marginBottom: 16 }} />

            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={{ width: "100%", padding: 8, marginBottom: 16 }}>
              <option value="todo">Todo</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <label>Assignee</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : "")} style={{ width: "100%", padding: 8, marginBottom: 16 }}>
              <option value="">Select Assignee</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>

            <label>Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 16 }} />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={closeModal} style={{ padding: "0.5rem 1rem" }}>Cancel</button>
              <button onClick={handleTaskSubmit} disabled={creating} style={{ padding: "0.5rem 1rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: creating ? "not-allowed" : "pointer", opacity: creating ? 0.6 : 1 }}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}