import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import StudentOverview from "./pages/student/StudentOverview";
import StudentDiet from "./pages/student/StudentDiet";
import StudentTraining from "./pages/student/StudentTraining";
import StudentProtocol from "./pages/student/StudentProtocol";
import StudentContent from "./pages/student/StudentContent";
import StudentSubscription from "./pages/student/StudentSubscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminPlans from "./pages/admin/AdminPlans";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            {/* Student routes */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><StudentOverview /></ProtectedRoute>} />
            <Route path="/dashboard/diet" element={<ProtectedRoute requiredRole="student"><StudentDiet /></ProtectedRoute>} />
            <Route path="/dashboard/training" element={<ProtectedRoute requiredRole="student"><StudentTraining /></ProtectedRoute>} />
            <Route path="/dashboard/protocol" element={<ProtectedRoute requiredRole="student"><StudentProtocol /></ProtectedRoute>} />
            <Route path="/dashboard/content" element={<ProtectedRoute requiredRole="student"><StudentContent /></ProtectedRoute>} />
            <Route path="/dashboard/subscription" element={<ProtectedRoute requiredRole="student"><StudentSubscription /></ProtectedRoute>} />
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute requiredRole="admin"><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute requiredRole="admin"><AdminPlans /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
