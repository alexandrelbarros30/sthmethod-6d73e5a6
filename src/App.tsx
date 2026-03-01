import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          {/* Student routes */}
          <Route path="/dashboard" element={<StudentOverview />} />
          <Route path="/dashboard/diet" element={<StudentDiet />} />
          <Route path="/dashboard/training" element={<StudentTraining />} />
          <Route path="/dashboard/protocol" element={<StudentProtocol />} />
          <Route path="/dashboard/content" element={<StudentContent />} />
          <Route path="/dashboard/subscription" element={<StudentSubscription />} />
          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
