import { lazy, Suspense, useEffect } from "react";
import { fixWallaceValentimContext } from "@/lib/fix-wallace-context";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminReauthProvider } from "@/hooks/useAdminReauth";
import FriendlyErrorBoundary from "@/components/system/FriendlyErrorBoundary";
import Erro from "./pages/Erro";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Cadastro from "./pages/Cadastro";
import Questionario from "./pages/Questionario";
import Install from "./pages/Install";
import BaixarApp from "./pages/BaixarApp";
import BaixarApk from "./pages/BaixarApk";
import Sobre from "./pages/Sobre";
import Free from "./pages/Free";
import ComoFunciona from "./pages/ComoFunciona";
import Tendencias from "./pages/Tendencias";
import FitnessCenario2026 from "./pages/FitnessCenario2026";
import QuartetoMagico from "./pages/QuartetoMagico";
import RecomposicaoAvancada from "./pages/RecomposicaoAvancada";
import SubcutaneaEstrategia from "./pages/SubcutaneaEstrategia";
import CinturaEstetica from "./pages/CinturaEstetica";
import TriadeIntestino from "./pages/TriadeIntestino";
import MasteronAndrogenico from "./pages/MasteronAndrogenico";
import DrostanolonaTecnica from "./pages/DrostanolonaTecnica";
import GlowBlend from "./pages/GlowBlend";
import GhkCu from "./pages/GhkCu";
import Gestrinona from "./pages/Gestrinona";
import PlatoMetabolico from "./pages/PlatoMetabolico";
import Trembolona from "./pages/Trembolona";
import Clenbuterol from "./pages/Clenbuterol";
import PeriodizacaoMedicamentos from "./pages/PeriodizacaoMedicamentos";
import RestauracaoMuscular from "./pages/RestauracaoMuscular";
import Ginecomastia from "./pages/Ginecomastia";
import HormoniosBfAlto from "./pages/HormoniosBfAlto";
import TirzepatidaHipertrofia from "./pages/TirzepatidaHipertrofia";
import TirzepatidaColaterais from "./pages/TirzepatidaColaterais";
import TirzepatidaDesmame from "./pages/TirzepatidaDesmame";
import TirzepatidaRetatrutida from "./pages/TirzepatidaRetatrutida";
import MounjaroPesoTravado from "./pages/MounjaroPesoTravado";
import HipertensaoArterial from "./pages/HipertensaoArterial";
import CarboidratosHipertrofia from "./pages/CarboidratosHipertrofia";
import ProteinaSuperavit from "./pages/ProteinaSuperavit";
import OleosSementes from "./pages/OleosSementes";
import Ultraprocessados from "./pages/Ultraprocessados";
import MarcadoresLaboratoriais from "./pages/MarcadoresLaboratoriais";
import TriagemMarcadores from "./pages/TriagemMarcadores";
import Promo from "./pages/Promo";
import EvolucaoPublica from "./pages/EvolucaoPublica";
import Programa from "./pages/Programa";
import Faq from "./pages/Faq";
import CompraConcluida from "./pages/CompraConcluida";
import Termo from "./pages/legal/Termo";
import Privacidade from "./pages/legal/Privacidade";
import FilaPublica from "./pages/FilaPublica";
import FilaAberta from "./pages/FilaAberta";
import Cas from "./pages/Cas";
import CasLogin from "./pages/cas/CasLogin";
import CasRegister from "./pages/cas/CasRegister";
import CasForgotPassword from "./pages/cas/CasForgotPassword";
import CasResetPassword from "./pages/cas/CasResetPassword";
import CasProfile from "./pages/cas/CasProfile";
import CasAdmin from "./pages/cas/CasAdmin";
import { CasAuthProvider } from "@/contexts/CasAuthContext";
import CasProtectedRoute from "@/components/cas/CasProtectedRoute";
import PreviewTemaVerde from "./pages/PreviewTemaVerde";
import CoachLanding from "./pages/coach/CoachLanding";
import CoachAuth from "./pages/coach/CoachAuth";
import CoachOnboarding from "./pages/coach/CoachOnboarding";
import CoachRoute from "@/components/coach/CoachRoute";
import { lazyWithRetry } from "@/lib/lazy-retry";
const CoachDashboard = lazyWithRetry(() => import("./pages/coach/CoachDashboard"));
const CoachStudents = lazyWithRetry(() => import("./pages/coach/CoachStudents"));
const CoachInvites = lazyWithRetry(() => import("./pages/coach/CoachInvites"));
const CoachPlans = lazyWithRetry(() => import("./pages/coach/CoachPlans"));
const CoachSettings = lazyWithRetry(() => import("./pages/coach/CoachSettings"));
const CoachPublicInvite = lazyWithRetry(() => import("./pages/coach/CoachPublicInvite"));
const CoachStudentHome = lazyWithRetry(() => import("./pages/coach/CoachStudentHome"));
const CoachPrograms = lazyWithRetry(() => import("./pages/coach/CoachPrograms"));
const CoachProgramEditor = lazyWithRetry(() => import("./pages/coach/CoachProgramEditor"));
const CoachStudentWorkouts = lazyWithRetry(() => import("./pages/coach/CoachStudentWorkouts"));
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
import StudentMetabolic from "./pages/student/StudentMetabolic";
import StudentAds from "./pages/student/StudentAds";
import StudentAssistant from "./pages/student/StudentAssistant";
import StudentSthiaFood from "./pages/student/StudentSthiaFood";
import DiarioAlimentar from "./pages/DiarioAlimentar";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNutriMetrics from "./pages/admin/AdminNutriMetrics";
import AdminFixCurty from "./pages/admin/AdminFixCurty";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminIdentityVerification from "./pages/admin/AdminIdentityVerification";
import AdminAuthorizedContacts from "./pages/admin/AdminAuthorizedContacts";

import AdminPlans from "./pages/admin/AdminPlans";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPaymentLinks from "./pages/admin/AdminPaymentLinks";
import PagarLink from "./pages/PagarLink";
import AdminImageConsents from "./pages/admin/AdminImageConsents";
import AutorizacaoImagem from "./pages/AutorizacaoImagem";
import AutorizarTelefone from "./pages/AutorizarTelefone";
import AlterarDados from "./pages/AlterarDados";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminNutrition from "./pages/admin/AdminNutrition";
import AdminTraining from "./pages/admin/AdminTraining";
import AdminExerciseLibrary from "./pages/admin/AdminExerciseLibrary";
import AdminPreviewCompare from "./pages/admin/AdminPreviewCompare";
import AdminTrainingPrograms from "./pages/admin/AdminTrainingPrograms";
import AdminContent from "./pages/admin/AdminContent";
import AdminLayoutExterno from "./pages/admin/AdminLayoutExterno";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminDietLibrary from "./pages/admin/AdminDietLibrary";
import AdminProtocolLibrary from "./pages/admin/AdminProtocolLibrary";
import AdminPopups from "./pages/admin/AdminPopups";
import AdminAds from "./pages/admin/AdminAds";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReleaseLog from "./pages/admin/AdminReleaseLog";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminAccessAudit from "./pages/admin/AdminAccessAudit";
import AdminBackups from "./pages/admin/AdminBackups";
import AdminAppReleases from "./pages/admin/AdminAppReleases";
import AdminCoach from "./pages/admin/AdminCoach";
import StudentFeedbackHistory from "./pages/student/StudentFeedbackHistory";
import AdminBudgets from "./pages/admin/AdminBudgets";
import AdminQueue from "./pages/admin/AdminQueue";
import AdminUpdates from "./pages/admin/AdminUpdates";
import AdminPushHistory from "./pages/admin/AdminPushHistory";
import AdminFoodAI from "./pages/admin/AdminFoodAI";
import AdminFoodAILogs from "./pages/admin/AdminFoodAILogs";
import AdminFoodAIDashboard from "./pages/admin/AdminFoodAIDashboard";
import AdminAiMetrics from "./pages/admin/AdminAiMetrics";
import AdminAiAccess from "./pages/admin/AdminAiAccess";
import AdminSthia from "./pages/admin/AdminSthia";
import AdminSthAiSettings from "./pages/admin/AdminSthAiSettings";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminCrm from "./pages/admin/AdminCrm";
import AdminChatChannel from "./pages/admin/AdminChatChannel";
import AdminChatInstall from "./pages/admin/AdminChatInstall";
import AdminCrmCampaigns from "./pages/admin/AdminCrmCampaigns";
import AdminCrmAutomations from "./pages/admin/AdminCrmAutomations";
import AdminCrmGruposAgenda from "./pages/admin/AdminCrmGruposAgenda";
import AdminBroadcastAlunos from "./pages/admin/AdminBroadcastAlunos";
import AdminCrmQueues from "./pages/admin/AdminCrmQueues";
import AdminCrmTasks from "./pages/admin/AdminCrmTasks";
import AdminCrmAi from "./pages/admin/AdminCrmAi";
import AdminCrmPipeline from "./pages/admin/AdminCrmPipeline";
import AdminCrmSettings from "./pages/admin/AdminCrmSettings";
import AdminCrmTemplates from "./pages/admin/AdminCrmTemplates";
import AdminCrmNutriBloqueios from "./pages/admin/AdminCrmNutriBloqueios";
import AdminCrmFlow from "./pages/admin/AdminCrmFlow";
import AdminSuperCoach from "./pages/admin/AdminSuperCoach";
import StudentConsultas from "./pages/student/StudentConsultas";
import ConsultorDashboard from "./pages/consultor/ConsultorDashboard";
import AssistenteDashboard from "./pages/assistente/AssistenteDashboard";
import FinanceiroDashboard from "./pages/financeiro/FinanceiroDashboard";
import NotFound from "./pages/NotFound";
import NutriRedirect from "./pages/NutriRedirect";
import Unsubscribe from "./pages/Unsubscribe";
import { useDynamicFavicon } from "@/hooks/useDynamicFavicon";
import { useAdminTheme } from "@/hooks/useAdminTheme";
import { useAccessLog } from "@/hooks/useAccessLog";
import { usePublicAppleTheme } from "@/hooks/usePublicAppleTheme";
// UpdateBanner removido — sem popup de atualização automático no portal/app
import { APP_RELEASE_VERSION } from "@/lib/app-version";
import AccessibilityThemeButton from "@/components/student/AccessibilityThemeButton";
import { useAccessibilityTheme } from "@/hooks/useAccessibilityTheme";
import LaunchAppPopup from "@/components/LaunchAppPopup";
import NativeUpdateBanner from "@/components/NativeUpdateBanner";

// Lazy load pages that use Tiptap editor to avoid blocking the app
const AdminDiet = lazyWithRetry(() => import("./pages/admin/AdminDiet"));
const AdminDietAI = lazyWithRetry(() => import("./pages/admin/AdminDietAI"));
const AdminDietAudit = lazyWithRetry(() => import("./pages/admin/AdminDietAudit"));
const AdminProtocol = lazyWithRetry(() => import("./pages/admin/AdminProtocol"));
const AdminProtocolAI = lazyWithRetry(() => import("./pages/admin/AdminProtocolAI"));
const AdminStudentAnalysis = lazyWithRetry(() => import("./pages/admin/AdminStudentAnalysis"));
const AdminAnalysisHistory = lazyWithRetry(() => import("./pages/admin/AdminAnalysisHistory"));
const LeituraLaboratorial = lazyWithRetry(() => import("./pages/LeituraLaboratorial"));
const AdminAIHistory = lazyWithRetry(() => import("./pages/admin/AdminAIHistory"));
const AiLanding = lazyWithRetry(() => import("./pages/ai/AiLanding"));
const AiOnboarding = lazyWithRetry(() => import("./pages/ai/AiOnboarding"));
const AiLogin = lazyWithRetry(() => import("./pages/ai/AiLogin"));
const AiForgotPassword = lazyWithRetry(() => import("./pages/ai/AiForgotPassword"));
const AiResetPassword = lazyWithRetry(() => import("./pages/ai/AiResetPassword"));
const AiDashboard = lazyWithRetry(() => import("./pages/ai/AiDashboard"));
const AiModule = lazyWithRetry(() => import("./pages/ai/AiModule"));
const AiProgress = lazyWithRetry(() => import("./pages/ai/AiProgress"));
const AiSubscription = lazyWithRetry(() => import("./pages/ai/AiSubscription"));
const AiHealth = lazyWithRetry(() => import("./pages/ai/AiHealth"));
const AiCoaches = lazyWithRetry(() => import("./pages/ai/AiCoaches"));
const AiFood = lazyWithRetry(() => import("./pages/ai/AiFood"));
const AiProfile = lazyWithRetry(() => import("./pages/ai/AiProfile"));
const AiLeituraVisual = lazyWithRetry(() => import("./pages/ai/AiLeituraVisual"));
const AiBodyImages = lazyWithRetry(() => import("./pages/ai/AiBodyImages"));
const AiWorkoutHistory = lazyWithRetry(() => import("./pages/ai/AiWorkoutHistory"));
const AiSobre = lazyWithRetry(() => import("./pages/ai/AiSobre"));
const AiLegal = lazyWithRetry(() => import("./pages/ai/AiLegal"));
const AiInstalar = lazyWithRetry(() => import("./pages/ai/AiInstalar"));
const AiLegalDoc = lazyWithRetry(() => import("./pages/ai/AiLegalDoc"));
const AiHistory = lazyWithRetry(() => import("./pages/ai/AiHistory"));

const LazyFallback = () => <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground text-sm">Carregando...</p></div>;

// Defaults tuned for mobile/PWA: when the app returns from background the
// previous data stays on screen (marcações de refeição, hidratação, séries,
// check-ins do protocolo etc.) e o refetch acontece silenciosamente em
// segundo plano, sem zerar a UI.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      placeholderData: (prev: unknown) => prev,
      retry: 1,
    },
  },
});

const DynamicHead = () => {
  useDynamicFavicon();
  useAdminTheme();
  useAccessLog();
  usePublicAppleTheme();
  useAccessibilityTheme();
  return null;
};

const App = () => {
  useEffect(() => {
    // Corrige dados legados do aluno Wallace Valentim que estavam misturados
    fixWallaceValentimContext().then(res => {
      if (res.success) console.log('Contextos de Wallace Valentim sincronizados.');
    });
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AdminReauthProvider>
          <DynamicHead />
          {/* UpdateBanner removido a pedido: sem popup de atualização ao entrar */}
          <AccessibilityThemeButton />
          <NativeUpdateBanner />
          <LaunchAppPopup scope="site" />
          <FriendlyErrorBoundary>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/ai" element={<Suspense fallback={<LazyFallback />}><AiLanding /></Suspense>} />
            <Route path="/ai/home" element={<Suspense fallback={<LazyFallback />}><AiLanding /></Suspense>} />
            <Route path="/ai/login" element={<Suspense fallback={<LazyFallback />}><AiLogin /></Suspense>} />
            <Route path="/ai/onboarding" element={<Suspense fallback={<LazyFallback />}><AiOnboarding /></Suspense>} />
            <Route path="/ai/esqueci-senha" element={<Suspense fallback={<LazyFallback />}><AiForgotPassword /></Suspense>} />
            <Route path="/ai/redefinir-senha" element={<Suspense fallback={<LazyFallback />}><AiResetPassword /></Suspense>} />
            <Route path="/ai/app" element={<Suspense fallback={<LazyFallback />}><AiDashboard /></Suspense>} />
            <Route path="/ai/app/progresso" element={<Suspense fallback={<LazyFallback />}><AiProgress /></Suspense>} />
            <Route path="/ai/app/saude" element={<Suspense fallback={<LazyFallback />}><AiHealth /></Suspense>} />
            <Route path="/ai/app/coaches" element={<Suspense fallback={<LazyFallback />}><AiCoaches /></Suspense>} />
            <Route path="/ai/app/diario" element={<Suspense fallback={<LazyFallback />}><AiFood /></Suspense>} />
            <Route path="/ai/app/perfil" element={<Suspense fallback={<LazyFallback />}><AiProfile /></Suspense>} />
            <Route path="/ai/app/imagens" element={<Suspense fallback={<LazyFallback />}><AiBodyImages /></Suspense>} />
            <Route path="/ai/app/treino/historico" element={<Suspense fallback={<LazyFallback />}><AiWorkoutHistory /></Suspense>} />
            <Route path="/ai/sobre" element={<Suspense fallback={<LazyFallback />}><AiSobre /></Suspense>} />
            <Route path="/ai/legal" element={<Suspense fallback={<LazyFallback />}><AiLegal /></Suspense>} />
            <Route path="/ai/instalar" element={<Suspense fallback={<LazyFallback />}><AiInstalar /></Suspense>} />
            <Route path="/ai/historico" element={<Suspense fallback={<LazyFallback />}><AiHistory /></Suspense>} />
            <Route path="/ai/baixar" element={<Suspense fallback={<LazyFallback />}><AiInstalar /></Suspense>} />
            <Route path="/ai/legal/:slug" element={<Suspense fallback={<LazyFallback />}><AiLegalDoc /></Suspense>} />
            <Route path="/ai/leitura/:id" element={<Suspense fallback={<LazyFallback />}><AiLeituraVisual /></Suspense>} />
            <Route path="/ai/app/:slug" element={<Suspense fallback={<LazyFallback />}><AiModule /></Suspense>} />
            <Route path="/ai/assinatura" element={<Suspense fallback={<LazyFallback />}><AiSubscription /></Suspense>} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/questionario" element={<Questionario />} />
            <Route path="/install" element={<Install />} />
            <Route path="/baixar-app" element={<BaixarApp />} />
            <Route path="/baixar-apk" element={<BaixarApk />} />
            <Route path="/download" element={<BaixarApp />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/como-funciona" element={<ComoFunciona />} />
            <Route path="/free" element={<Free />} />
            <Route path="/tendencias" element={<Tendencias />} />
            <Route path="/leitura-laboratorial/:id" element={<Suspense fallback={<LazyFallback />}><LeituraLaboratorial /></Suspense>} />
            <Route path="/tendencias/cenario-fitness-2026" element={<FitnessCenario2026 />} />
            <Route path="/tendencias/quarteto-magico" element={<QuartetoMagico />} />
            <Route path="/tendencias/recomposicao-avancada" element={<RecomposicaoAvancada />} />
            <Route path="/tendencias/subcutanea-estrategia" element={<SubcutaneaEstrategia />} />
            <Route path="/tendencias/cintura-estetica" element={<CinturaEstetica />} />
            <Route path="/tendencias/triade-intestino-hormonio" element={<TriadeIntestino />} />
            <Route path="/tendencias/drostanolona-masteron" element={<MasteronAndrogenico />} />
            <Route path="/tendencias/drostanolona-tecnica" element={<DrostanolonaTecnica />} />
            <Route path="/tendencias/glow-blend" element={<GlowBlend />} />
            <Route path="/tendencias/ghk-cu" element={<GhkCu />} />
            <Route path="/tendencias/gestrinona" element={<Gestrinona />} />
            <Route path="/tendencias/plato-metabolico" element={<PlatoMetabolico />} />
            <Route path="/tendencias/trembolona" element={<Trembolona />} />
            <Route path="/tendencias/clenbuterol" element={<Clenbuterol />} />
            <Route path="/tendencias/periodizacao-medicamentos" element={<PeriodizacaoMedicamentos />} />
            <Route path="/tendencias/restauracao-muscular" element={<RestauracaoMuscular />} />
            <Route path="/tendencias/ginecomastia" element={<Ginecomastia />} />
            <Route path="/tendencias/hormonios-bf-alto" element={<HormoniosBfAlto />} />
            <Route path="/tendencias/tirzepatida-hipertrofia" element={<TirzepatidaHipertrofia />} />
            <Route path="/tendencias/tirzepatida-colaterais" element={<TirzepatidaColaterais />} />
            <Route path="/tendencias/tirzepatida-desmame" element={<TirzepatidaDesmame />} />
            <Route path="/tendencias/tirzepatida-vs-retatrutida" element={<TirzepatidaRetatrutida />} />
            <Route path="/tendencias/mounjaro-peso-travado" element={<MounjaroPesoTravado />} />
            <Route path="/tendencias/hipertensao-arterial" element={<HipertensaoArterial />} />
            <Route path="/tendencias/carboidratos-hipertrofia" element={<CarboidratosHipertrofia />} />
            <Route path="/tendencias/proteina-superavit" element={<ProteinaSuperavit />} />
            <Route path="/tendencias/oleos-sementes" element={<OleosSementes />} />
            <Route path="/tendencias/ultraprocessados-saude-mental" element={<Ultraprocessados />} />
            <Route path="/tendencias/marcadores-laboratoriais" element={<MarcadoresLaboratoriais />} />
            <Route path="/triagem-marcadores" element={<TriagemMarcadores />} />
            <Route path="/promo" element={<Promo />} />
            <Route path="/promo/:slug" element={<Promo />} />
            <Route path="/programa" element={<Programa />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/compra-concluida" element={<CompraConcluida />} />
            <Route path="/termo" element={<Termo />} />
            <Route path="/termos" element={<Termo />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/evolucao" element={<EvolucaoPublica />} />
            <Route path="/fila/:token" element={<FilaPublica />} />
            <Route path="/fila" element={<FilaAberta />} />
            <Route path="/preview-tema-verde" element={<PreviewTemaVerde />} />
            <Route path="/diario-alimentar" element={<DiarioAlimentar />} />
            <Route path="/n" element={<NutriRedirect />} />
            <Route path="/cas/login" element={<CasAuthProvider><CasLogin /></CasAuthProvider>} />
            <Route path="/cas/cadastro" element={<CasAuthProvider><CasRegister /></CasAuthProvider>} />
            <Route path="/cas/esqueci-senha" element={<CasAuthProvider><CasForgotPassword /></CasAuthProvider>} />
            <Route path="/cas/reset-password" element={<CasAuthProvider><CasResetPassword /></CasAuthProvider>} />
            <Route path="/cas/perfil" element={<CasAuthProvider><CasProtectedRoute><CasProfile /></CasProtectedRoute></CasAuthProvider>} />
            <Route path="/cas/admin" element={<CasAuthProvider><CasProtectedRoute><CasAdmin /></CasProtectedRoute></CasAuthProvider>} />
            <Route path="/cas" element={<CasAuthProvider><CasProtectedRoute><Cas /></CasProtectedRoute></CasAuthProvider>} />

            {/* STH METHOD COACH */}
            <Route path="/coach" element={<Suspense fallback={<LazyFallback />}><CoachLanding /></Suspense>} />
            <Route path="/coach/entrar" element={<Suspense fallback={<LazyFallback />}><CoachAuth /></Suspense>} />
            <Route path="/coach/comecar" element={<Suspense fallback={<LazyFallback />}><CoachOnboarding /></Suspense>} />
            <Route path="/coach/convite/:token" element={<Suspense fallback={<LazyFallback />}><CoachPublicInvite /></Suspense>} />
            <Route path="/coach/painel" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachDashboard /></Suspense></CoachRoute>} />
            <Route path="/coach/alunos" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachStudents /></Suspense></CoachRoute>} />
            <Route path="/coach/treinos" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachPrograms /></Suspense></CoachRoute>} />
            <Route path="/coach/treinos/:programId" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachProgramEditor /></Suspense></CoachRoute>} />
            <Route path="/coach/convites" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachInvites /></Suspense></CoachRoute>} />
            <Route path="/coach/planos" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachPlans /></Suspense></CoachRoute>} />
            <Route path="/coach/configuracoes" element={<CoachRoute audience="professional"><Suspense fallback={<LazyFallback />}><CoachSettings /></Suspense></CoachRoute>} />
            <Route path="/coach/aluno" element={<CoachRoute audience="student"><Suspense fallback={<LazyFallback />}><CoachStudentHome /></Suspense></CoachRoute>} />
            <Route path="/coach/aluno/treinos" element={<CoachRoute audience="student"><Suspense fallback={<LazyFallback />}><CoachStudentWorkouts /></Suspense></CoachRoute>} />
            {/* MEAD aliases — landing oficial */}
            <Route path="/mead/login" element={<CasAuthProvider><CasLogin /></CasAuthProvider>} />
            <Route path="/mead/cadastro" element={<CasAuthProvider><CasRegister /></CasAuthProvider>} />
            <Route path="/mead/esqueci-senha" element={<CasAuthProvider><CasForgotPassword /></CasAuthProvider>} />
            <Route path="/mead/reset-password" element={<CasAuthProvider><CasResetPassword /></CasAuthProvider>} />
            <Route path="/mead/perfil" element={<CasAuthProvider><CasProtectedRoute><CasProfile /></CasProtectedRoute></CasAuthProvider>} />
            <Route path="/mead/admin" element={<CasAuthProvider><CasProtectedRoute><CasAdmin /></CasProtectedRoute></CasAuthProvider>} />
            <Route path="/mead" element={<CasAuthProvider><CasProtectedRoute><Cas /></CasProtectedRoute></CasAuthProvider>} />
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
            <Route path="/dashboard/pagar" element={<ProtectedRoute allowedRoles={["student"]}><StudentRenew /></ProtectedRoute>} />
            <Route path="/dashboard/recipes" element={<ProtectedRoute allowedRoles={["student"]}><StudentRecipes /></ProtectedRoute>} />
            <Route path="/dashboard/evolution" element={<ProtectedRoute allowedRoles={["student"]}><StudentEvolution /></ProtectedRoute>} />
            <Route path="/dashboard/bioimpedance" element={<ProtectedRoute allowedRoles={["student"]}><StudentBioimpedance /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />
            <Route path="/dashboard/metabolic" element={<ProtectedRoute allowedRoles={["student"]}><StudentMetabolic /></ProtectedRoute>} />
            <Route path="/dashboard/sthia-food" element={<ProtectedRoute allowedRoles={["student"]}><StudentSthiaFood /></ProtectedRoute>} />
            <Route path="/dashboard/ads" element={<ProtectedRoute allowedRoles={["student"]}><StudentAds /></ProtectedRoute>} />
            <Route path="/dashboard/consultas" element={<ProtectedRoute allowedRoles={["student"]}><StudentConsultas /></ProtectedRoute>} />
            <Route path="/dashboard/assistente" element={<ProtectedRoute allowedRoles={["student"]}><StudentAssistant /></ProtectedRoute>} />
            <Route path="/dashboard/feedbacks" element={<ProtectedRoute allowedRoles={["student"]}><StudentFeedbackHistory /></ProtectedRoute>} />
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/metrics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminNutriMetrics /></ProtectedRoute>} />

            <Route path="/admin/fix-curty" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFixCurty /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/admin/verificacao-identidade" element={<ProtectedRoute allowedRoles={["admin"]}><AdminIdentityVerification /></ProtectedRoute>} />
            <Route path="/admin/telefones-autorizados" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><AdminAuthorizedContacts /></ProtectedRoute>} />
            <Route path="/admin/plans" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPlans /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/payment-links" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPaymentLinks /></ProtectedRoute>} />
            <Route path="/admin/image-consents" element={<ProtectedRoute allowedRoles={["admin"]}><AdminImageConsents /></ProtectedRoute>} />
            <Route path="/admin/revenue" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRevenue /></ProtectedRoute>} />
            <Route path="/admin/diet" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<LazyFallback />}><AdminDiet /></Suspense></ProtectedRoute>} />
            <Route path="/admin/nutrition" element={<ProtectedRoute allowedRoles={["admin"]}><AdminNutrition /></ProtectedRoute>} />
            <Route path="/admin/dieta-ia" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminDietAI /></Suspense></ProtectedRoute>} />
            <Route path="/admin/protocolo-ia" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminProtocolAI /></Suspense></ProtectedRoute>} />
             <Route path="/admin/analise-aluno" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminStudentAnalysis /></Suspense></ProtectedRoute>} />
             <Route path="/admin/analise-historico" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminAnalysisHistory /></Suspense></ProtectedRoute>} />
            <Route path="/admin/dieta-auditoria" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminDietAudit /></Suspense></ProtectedRoute>} />
            <Route path="/admin/diet-library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDietLibrary /></ProtectedRoute>} />
            <Route path="/admin/protocol" element={<ProtectedRoute allowedRoles={["admin"]}><Suspense fallback={<LazyFallback />}><AdminProtocol /></Suspense></ProtectedRoute>} />
            <Route path="/admin/training" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTraining /></ProtectedRoute>} />
            <Route path="/admin/exercise-library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminExerciseLibrary /></ProtectedRoute>} />
            <Route path="/admin/preview-compare" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPreviewCompare /></ProtectedRoute>} />
            <Route path="/admin/workout-templates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTrainingPrograms /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allowedRoles={["admin"]}><AdminContent /></ProtectedRoute>} />
            <Route path="/admin/layout" element={<ProtectedRoute allowedRoles={["admin"]}><AdminLayoutExterno /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRoles /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={["admin"]}><AdminStaff /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCoupons /></ProtectedRoute>} />
            <Route path="/admin/protocol-library" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProtocolLibrary /></ProtectedRoute>} />
            <Route path="/admin/popups" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPopups /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["admin"]}><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/release-log" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReleaseLog /></ProtectedRoute>} />
            <Route path="/admin/ia-historico" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminAIHistory /></Suspense></ProtectedRoute>} />
            <Route path="/consultor/ia-historico" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><Suspense fallback={<LazyFallback />}><AdminAIHistory /></Suspense></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><AdminFeedback /></ProtectedRoute>} />
            <Route path="/admin/access-audit" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAccessAudit /></ProtectedRoute>} />
            <Route path="/admin/backups" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBackups /></ProtectedRoute>} />
            <Route path="/admin/coach" element={<ProtectedRoute allowedRoles={["admin","admin_viewer"]}><AdminCoach /></ProtectedRoute>} />
            <Route path="/admin/app-releases" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAppReleases /></ProtectedRoute>} />
            <Route path="/admin/budgets" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBudgets /></ProtectedRoute>} />
            <Route path="/admin/ads" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAds /></ProtectedRoute>} />
            <Route path="/admin/queue" element={<ProtectedRoute allowedRoles={["admin"]}><AdminQueue /></ProtectedRoute>} />
            <Route path="/admin/updates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUpdates /></ProtectedRoute>} />
            <Route path="/admin/push-history" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPushHistory /></ProtectedRoute>} />
            <Route path="/admin/food-ai" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><AdminFoodAI /></ProtectedRoute>} />
            <Route path="/admin/food-ai/logs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFoodAILogs /></ProtectedRoute>} />
            <Route path="/admin/food-ai/dashboard" element={<ProtectedRoute allowedRoles={["admin","consultor"]}><AdminFoodAIDashboard /></ProtectedRoute>} />
            <Route path="/admin/ai-metricas" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAiMetrics /></ProtectedRoute>} />
            <Route path="/admin/ai-acessos" element={<ProtectedRoute allowedRoles={["admin", "consultor"]}><AdminAiAccess /></ProtectedRoute>} />
            <Route path="/consultor/ai-acessos" element={<ProtectedRoute allowedRoles={["admin", "consultor"]}><AdminAiAccess /></ProtectedRoute>} />
            <Route path="/admin/sthia" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSthia /></ProtectedRoute>} />
            <Route path="/admin/emails" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEmails /></ProtectedRoute>} />
            <Route path="/admin/sth-ai-config" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSthAiSettings /></ProtectedRoute>} />
            <Route path="/admin/crm" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrm /></ProtectedRoute>} />
            <Route path="/admin/crm/instalar" element={<ProtectedRoute allowedRoles={["admin"]}><AdminChatInstall /></ProtectedRoute>} />
            <Route path="/chat/:canal" element={<ProtectedRoute allowedRoles={["admin","consultor","assistente","financeiro"]}><AdminChatChannel /></ProtectedRoute>} />
            <Route path="/admin/crm/campanhas" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmCampaigns /></ProtectedRoute>} />
            <Route path="/admin/crm/automacoes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmAutomations /></ProtectedRoute>} />
            <Route path="/admin/crm/grupos-agenda" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmGruposAgenda /></ProtectedRoute>} />
            <Route path="/admin/broadcast-alunos" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBroadcastAlunos /></ProtectedRoute>} />
            <Route path="/admin/crm/filas" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmQueues /></ProtectedRoute>} />
            <Route path="/admin/crm/tarefas" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmTasks /></ProtectedRoute>} />
            <Route path="/admin/crm/ia" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmAi /></ProtectedRoute>} />
            <Route path="/admin/crm/pipeline" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmPipeline /></ProtectedRoute>} />
            <Route path="/admin/crm/configuracoes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmSettings /></ProtectedRoute>} />
            <Route path="/admin/crm/templates" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmTemplates /></ProtectedRoute>} />
            <Route path="/admin/crm/nutri-bloqueios" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmNutriBloqueios /></ProtectedRoute>} />
            <Route path="/admin/crm/supercoach" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSuperCoach /></ProtectedRoute>} />
            <Route path="/admin/crm/fluxo" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCrmFlow /></ProtectedRoute>} />
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
            <Route path="/consultor/protocol-library" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminProtocolLibrary /></ProtectedRoute>} />
            <Route path="/consultor/queue" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminQueue /></ProtectedRoute>} />
            <Route path="/consultor/image-consents" element={<ProtectedRoute allowedRoles={["consultor"]}><AdminImageConsents /></ProtectedRoute>} />
            {/* Assistente routes */}
            <Route path="/assistente" element={<ProtectedRoute allowedRoles={["assistente"]}><AssistenteDashboard /></ProtectedRoute>} />
            <Route path="/assistente/students" element={<ProtectedRoute allowedRoles={["assistente"]}><AdminStudents /></ProtectedRoute>} />
            <Route path="/assistente/register" element={<ProtectedRoute allowedRoles={["assistente"]}><AdminStudents /></ProtectedRoute>} />
            {/* Financeiro routes */}
            <Route path="/financeiro" element={<ProtectedRoute allowedRoles={["financeiro"]}><FinanceiroDashboard /></ProtectedRoute>} />
            <Route path="/financeiro/payments" element={<ProtectedRoute allowedRoles={["financeiro"]}><AdminPayments /></ProtectedRoute>} />
            <Route path="/financeiro/payment-links" element={<ProtectedRoute allowedRoles={["financeiro"]}><AdminPaymentLinks /></ProtectedRoute>} />
            <Route path="/financeiro/plans" element={<ProtectedRoute allowedRoles={["financeiro"]}><AdminPlans /></ProtectedRoute>} />
            <Route path="/financeiro/revenue" element={<ProtectedRoute allowedRoles={["financeiro"]}><FinanceiroDashboard /></ProtectedRoute>} />
            <Route path="/financeiro/billing" element={<ProtectedRoute allowedRoles={["financeiro"]}><AdminRevenue /></ProtectedRoute>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/pagar/:code" element={<PagarLink />} />
            <Route path="/autorizacao-imagem/:token" element={<AutorizacaoImagem />} />
            <Route path="/autorizar-telefone" element={<AutorizarTelefone />} />
            <Route path="/alterar-dados" element={<AlterarDados />} />
            <Route path="/erro" element={<Erro />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </FriendlyErrorBoundary>
          <div className="fixed bottom-1 right-1 text-[9px] text-muted-foreground/40 pointer-events-none z-50 font-mono">
            Versão Beta {APP_RELEASE_VERSION}
          </div>
          </AdminReauthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
