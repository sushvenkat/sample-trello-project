# 📌 Kanban Task Manager

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
DELETE /projects/:id

## 🧠 Core Logic

Task normalization ensures consistent status values.

Drag-and-drop flow:
1. Capture drag event
2. Extract source/destination
3. Update UI optimistically
4. Sync with backend
5. Web socket implementation for real time updates to tasks

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

1. http://localhost:5173/signup - signup a new user
2. http://localhost:5173/login - login with user
3. http://localhost:5173/dashboard - See multiple Projects/create Projects and delete if needed
4. http://localhost:5173/projects/{id} - See Tasks/Create tasks.

To add users to system with Names, run the script.ts file npx tsx script.ts
## 🔮 Future Improvements

- Redux / global state  (Did not choose REDUX store presently because of the number of components and complexity. But this is extensible.)
- Authorization on API with JWT tokens  - (I was not able to get this in due to time contraints). This would need a Bearer token to be added on the requests and a JWT.verify() on the backend service.

## 👩‍💻 Author

Sushma Venkat  
https://github.com/sushvenkat

## ⭐ Summary

This project demonstrates:
- Drag-and-drop system design  
- Kanban workflow  
- Full-stack integration  
- Optimistic UI updates  
