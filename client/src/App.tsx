import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProjectTasks from "./pages/ProjectTasks";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Login route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />}
      />

      {/* Signup route */}
      <Route path="/signup" element={<Signup />} />

      {/* Dashboard protected route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Project tasks page */}
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <ProjectTasks />
          </ProtectedRoute>
        }
      />

      {/* Default/fallback route */}
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}