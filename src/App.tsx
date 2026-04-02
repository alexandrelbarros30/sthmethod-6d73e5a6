import { lazy, Suspense } from "react";
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
import Questionario from "./pages/Questionario";
import Install from "./pages/Install";
import Free from "./pages/Free";
import StudentOverview from "./pages/student/StudentOverview";
import StudentHub from "./pages/student/StudentHub";
import StudentRecipes from "./pages/student/StudentRecipes";
import StudentDiet from "./pages/student/StudentDiet";
import StudentTraining from "./pages/student/StudentTraining";
import StudentGuidedWorkout from "./pages/student/StudentGuidedWorkout";
import StudentProtocol from "./pages/student/StudentProtocol";
import StudentContent from "./pages/student/StudentContent";
import StudentSubscription from "./pages/student/StudentSubscription";
import StudentRenew from "./pages/student/StudentRenew";
import StudentEvolution from "./pages/student/StudentEvolution";
import StudentBioimpedance from "./pages/student/StudentBioimpedance";
import StudentProfile from "./pages/student/StudentProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminNutrition from "./pages/admin/AdminNutrition";
import AdminTraining from "./pages/admin/AdminTraining";
import AdminExerciseLibrary from "./pages/admin/AdminExerciseLibrary";
import AdminTrainingPrograms from "./pages/admin/AdminTrainingPrograms";
import AdminContent from "./pages/admin/AdminContent";
import AdminLayoutExterno from "./pages/admin/AdminLayoutExterno";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminDietLibrary from "./pages/admin/AdminDietLibrary";
import ConsultorDashboard from "./pages/consultor/ConsultorDashboard";
import AssistenteDashboard from "./pages/assistente/AssistenteDashboard";
import FinanceiroDashboard from "./pages/financeiro/FinanceiroDashboard";
import NotFound from "./pages/NotFound";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import { useAdminTheme } from "@/hooks/useAdminTheme";
import UpdateBanner from "@/components/shared/UpdateBanner";

// Lazy load pages that use Tiptap editor to avoid blocking the app
const AdminDiet = lazy(() => import("./pages/admin/AdminDiet"));
const AdminProtocol = lazy(() => import("./pages/admin/AdminProtocol"));

const LazyFallback = () => <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground text-sm">Carregando...</p></div>;

const queryClient = new QueryClient();

const DynamicHead = () => { useDynamicFavicon(); useAdminTheme(); return null; };

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DynamicHead />
          <UpdateBanner />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/questionario" element={<Questionario />} />
            <Route path="/install" element={<Install />} />
            <Route path="/free" element={<Free />} />
            {/* Student routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentOverview /></ProtectedRoute>} />
            <Route path="/dashboard/hub" element={<ProtectedRoute allowedRoles={["student"]}><StudentHub /></ProtectedRoute>} />
            <Route path="/dashboard/diet" element={<ProtectedRoute allowedRoles={["student"]}><StudentDiet /></ProtectedRoute>} />
            <Route path="/dashboard/training" element={<ProtectedRoute allowedRoles={["student"]}><StudentTraining /></ProtectedRoute>} />
            <Route path="/dashboard/guided-workout" element={<ProtectedRoute allowedRoles={["student"]}><StudentGuidedWorkout /></ProtectedRoute>} />
            <Route path="/dashboard/protocol" element={<ProtectedRoute allowedRoles={["student"]}><StudentProtocol /></ProtectedRoute>} />
            <Route path="/dashboard/content" element={<ProtectedRoute allowedRoles={["student"]}><StudentContent /></ProtectedRoute>} />
            <Route path="/dashboard/subscription" element={<ProtectedRoute allowedRoles={["student"]}><StudentSubscription /></ProtectedRoute>} />
            <Route path="/dashboard/renew" element={<ProtectedRoute allowedRoles={["student"]}><StudentRenew /></ProtectedRoute>} />
            <Route path="/dashboard/recipes" element={<ProtectedRoute allowedRoles={["student"]}><StudentRecipes /></ProtectedRoute>} />
            <Route path="/dashboard/evolution" element={<ProtectedRoute allowedRoles={["student"]}><StudentEvolution /></ProtectedRoute>} />
            <Route path="/dashboard/bioimpedance" element={<ProtectedRoute allowedRoles={["student"]}><StudentBioimpedance /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPlans /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/diet" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<LazyFallback />}><AdminDiet /></Suspense></ProtectedRoute>} />
            <Route path="/admin/nutrition" element={<ProtectedRoute allowedRoles={["admin"]}><AdminNutrition /></ProtectedRoute>} />
            <Route path="/admin/diet-library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDietLibrary /></ProtectedRoute>} />
            <Route path="/admin/protocol" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<LazyFallback />}><AdminProtocol /></Suspense></ProtectedRoute>} />
            <Route path="/admin/training" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTraining /></ProtectedRoute>} />
            <Route path="/admin/exercise-library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminExerciseLibrary /></ProtectedRoute>} />
            <Route path="/admin/workout-templates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTrainingPrograms /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allowedRoles={["admin"]}><AdminContent /></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={["admin"]}><AdminMessages /></ProtectedRoute>} />
            <Route path="/admin/layout" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayoutExterno /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRoles /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStaff /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCoupons /></ProtectedRoute>} />
            {/* Consultor routes */}
            <Route path="/consultor" element={<ProtectedRoute allowedRoles={["consultor"]}><ConsultorDashboard /></ProtectedRoute>} />
            <Route path="/consultor/students" element={<ProtectedRoute allowedRoles={["consultor"]}><ConsultorDashboard /></ProtectedRoute>} />
            <Route path="/consultor/diet" element={<ProtectedRoute allowedRoles={["consultor"]}><Suspense fallback={<LazyFallback />}><AdminDiet /></Suspense></ProtectedRoute>} />
            <Route path="/consultor/nutrition" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminNutrition /></ProtectedRoute>} />
            <Route path="/consultor/diet-library" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminDietLibrary /></ProtectedRoute>} />
            <Route path="/consultor/training" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminTraining /></ProtectedRoute>} />
            <Route path="/consultor/protocol" element={<ProtectedRoute allowedRoles={["consultor"]}><Suspense fallback={<LazyFallback />}><AdminProtocol /></Suspense></ProtectedRoute>} />
            <Route path="/consultor/exercise-library" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminExerciseLibrary /></ProtectedRoute>} />
            <Route path="/consultor/workout-templates" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminTrainingPrograms /></ProtectedRoute>} />
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
          <div className="fixed bottom-1 right-1 text-[9px] text-muted-foreground/40 pointer-events-none z-50 font-mono">
            Versão 1.2.2 – ST Coach Deep Link e Navegação Aprimorada
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
