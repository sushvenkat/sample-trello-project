# 📌 Sample Trello Project (Kanban Task Manager)

A full-stack Trello-style task management application that allows users to manage project tasks using a Kanban board UI with drag-and-drop functionality.

## 🚀 Features

- Kanban Board UI (Todo, In Progress, Done)
- User-based Task Grouping
- Drag and Drop using @hello-pangea/dnd
- Create Task with modal form
- Real-time UI updates (optimistic)
- Validation for duplicate titles and statuses

## 🏗️ Tech Stack

Frontend:
- React (Hooks)
- React Router
- TypeScript
- @hello-pangea/dnd

Backend:
- Node.js + Express
- Prisma ORM
- SQLite with BetterSQLite3 Adapter

          ┌──────────────────────┐
          │      Frontend        │
          │   React + 
            DnD UI(Library for 
            Drag,drop)     │
          │                      │
          │  - Drag & Drop       │
          │  - State Mgmt        │
          │  - API Calls         │
          └─────────┬────────────┘
                    │ HTTP (REST)
                    ▼
          ┌──────────────────────┐
          │      Backend         │
          │   Node + Express     │
          │                      │
          │  - Controllers       │
          │  - Validation        │
          │  - Business Logic    │
          └─────────┬────────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │       Prisma         │
          │        ORM           │
          └─────────┬────────────┘
                    │
                    ▼
          ┌──────────────────────┐
          │      Database        │
          │ (Postgres/SQLite)    │
          │                      │
          │  Users(Auth flow + 
            tasks)               │
          │  Tasks               │
          │  Projects            │
          └──────────────────────┘

## 📂 Project Structure

client/
 └── src/
     └── pages/
         └── ProjectTasks.tsx

## ⚙️ API Endpoints

GET    /projects/:id/users-with-tasks  
POST   /projects/:id/tasks/create  
PATCH  /projects/:id/tasks/:taskId/update-task  
GET    /users  

## 🧠 Core Logic

Task normalization ensures consistent status values.

Drag-and-drop flow:
1. Capture drag event
2. Extract source/destination
3. Update UI optimistically
4. Sync with backend

State structure:
[
  {
    user: { id, name },
    tasks: Task[]
  }
]

## ▶️ How to Run

git clone https://github.com/sushvenkat/sample-trello-project.git  
cd sample-trello-project/client  
npm install  
npm run dev  

cd sample-trello-project/prisma-server  
npm install  
npx tsx src/server.ts

Backend should run at http://localhost:3000
Frontend enpoint: http://localhost:5173/

To add users to system with Names, run the script.ts file npx tsx script.ts
## 🔮 Future Improvements

- Redux / global state  
- WebSocket real-time sync  
- Authentication  - OAuth2.0

## 👩‍💻 Author

Sushma Venkat  
https://github.com/sushvenkat

## ⭐ Summary

This project demonstrates:
- Drag-and-drop system design  
- Kanban workflow  
- Full-stack integration  
- Optimistic UI updates  

