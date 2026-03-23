import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

import authRouter from "./routes/auth";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
app.use(cors());
app.use(express.json());

// Existing routes
app.use("/auth", authRouter);
app.use("/projects", projectRoutes);
app.use("/projects/:id/tasks", taskRoutes);
app.use("/users", userRoutes);

// Create HTTP server for WS upgrade
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ noServer: true });

// Keep track of connected clients per project
const projectClients: Record<string, Set<WebSocket>> = {};

// Handle WS connections
wss.on("connection", (ws: WebSocket, request: http.IncomingMessage, projectId: string) => {
  if (!projectClients[projectId]) projectClients[projectId] = new Set();
  projectClients[projectId].add(ws);

  console.log(`WS connected for project ${projectId}. Total clients: ${projectClients[projectId].size}`);

  ws.on("close", () => {
    projectClients[projectId].delete(ws);
    console.log(`WS disconnected for project ${projectId}. Remaining clients: ${projectClients[projectId].size}`);
  });
});

// Upgrade HTTP to WS
server.on("upgrade", (request, socket, head) => {
  const match = request.url?.match(/\/projects\/(\d+)\/ws/);
  if (!match) {
    socket.destroy();
    return;
  }

  const projectId = match[1];
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request, projectId);
  });
});

// Broadcast helper for tasks updates
export function broadcastTasksUpdated(projectId: string) {
  const clients = projectClients[projectId] || new Set();
  const message = JSON.stringify({ type: "TASKS_UPDATED" });

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(message);
  });

  console.log(`Broadcast TASKS_UPDATED to ${clients.size} clients for project ${projectId}`);
}

// Start server
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});