import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import StudentOverview from "./pages/student/StudentOverview";
import StudentDiet from "./pages/student/StudentDiet";
import StudentTraining from "./pages/student/StudentTraining";
import StudentProtocol from "./pages/student/StudentProtocol";
import StudentContent from "./pages/student/StudentContent";
import StudentSubscription from "./pages/student/StudentSubscription";
import StudentRenew from "./pages/student/StudentRenew";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminDiet from "./pages/admin/AdminDiet";
import AdminProtocol from "./pages/admin/AdminProtocol";
import AdminTraining from "./pages/admin/AdminTraining";
import AdminContent from "./pages/admin/AdminContent";
import AdminLayoutExterno from "./pages/admin/AdminLayoutExterno";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminRoles from "./pages/admin/AdminRoles";
import ConsultorDashboard from "./pages/consultor/ConsultorDashboard";
import AssistenteDashboard from "./pages/assistente/AssistenteDashboard";
import FinanceiroDashboard from "./pages/financeiro/FinanceiroDashboard";
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
            <Route path="/cadastro" element={<Cadastro />} />
            {/* Student routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentOverview /></ProtectedRoute>} />
            <Route path="/dashboard/diet" element={<ProtectedRoute allowedRoles={["student"]}><StudentDiet /></ProtectedRoute>} />
            <Route path="/dashboard/training" element={<ProtectedRoute allowedRoles={["student"]}><StudentTraining /></ProtectedRoute>} />
            <Route path="/dashboard/protocol" element={<ProtectedRoute allowedRoles={["student"]}><StudentProtocol /></ProtectedRoute>} />
            <Route path="/dashboard/content" element={<ProtectedRoute allowedRoles={["student"]}><StudentContent /></ProtectedRoute>} />
            <Route path="/dashboard/subscription" element={<ProtectedRoute allowedRoles={["student"]}><StudentSubscription /></ProtectedRoute>} />
            <Route path="/dashboard/renew" element={<ProtectedRoute allowedRoles={["student"]}><StudentRenew /></ProtectedRoute>} />
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPlans /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/diet" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDiet /></ProtectedRoute>} />
            <Route path="/admin/protocol" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProtocol /></ProtectedRoute>} />
            <Route path="/admin/training" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTraining /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allowedRoles={["admin"]}><AdminContent /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMessages /></ProtectedRoute>} />
            <Route path="/admin/layout" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayoutExterno /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRoles /></ProtectedRoute>} />
            {/* Consultor routes */}
            <Route path="/consultor" element={<ProtectedRoute allowedRoles={["consultor"]}><ConsultorDashboard /></ProtectedRoute>} />
            <Route path="/consultor/students" element={<ProtectedRoute allowedRoles={["consultor"]}><ConsultorDashboard /></ProtectedRoute>} />
            <Route path="/consultor/diet" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminDiet /></ProtectedRoute>} />
            <Route path="/consultor/training" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminTraining /></ProtectedRoute>} />
            <Route path="/consultor/protocol" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminProtocol /></ProtectedRoute>} />
            {/* Assistente routes */}
            <Route path="/assistente" element={<ProtectedRoute allowedRoles={["assistente"]}><AssistenteDashboard /></ProtectedRoute>} />
            <Route path="/assistente/students" element={<ProtectedRoute allowedRoles={["assistente"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/assistente/register" element={<ProtectedRoute allowedRoles={["assistente"]}><AdminStudents /></ProtectedRoute>} />
            {/* Financeiro routes */}
            <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["financeiro"]}><FinanceiroDashboard /></ProtectedRoute>} />
            <Route path="/financeiro/payments" element={<ProtectedRoute allowedRoles={["financeiro"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/financeiro/plans" element={<ProtectedRoute allowedRoles={["financeiro"]}><AdminPlans /></ProtectedRoute>} />
            <Route path="/financeiro/revenue" element={<ProtectedRoute allowedRoles={["financeiro"]}><FinanceiroDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
