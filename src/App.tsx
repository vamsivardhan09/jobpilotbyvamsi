import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import JobDiscovery from "./pages/JobDiscovery";
import ResumeOptimizer from "./pages/ResumeOptimizer";
import StandaloneOptimizer from "./pages/StandaloneOptimizer";
import ResumePreview from "./pages/ResumePreview";
import Profile from "./pages/Profile";
import InterviewPractice from "./pages/InterviewPractice";
import VoiceInterview from "./pages/VoiceInterview";
import InterviewReport from "./pages/InterviewReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedWithSidebar = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedWithSidebar><Dashboard /></ProtectedWithSidebar>} />
            <Route path="/upload" element={<ProtectedWithSidebar><ResumeUpload /></ProtectedWithSidebar>} />
            <Route path="/jobs" element={<ProtectedWithSidebar><JobDiscovery /></ProtectedWithSidebar>} />
            <Route path="/optimize" element={<ProtectedWithSidebar><ResumeOptimizer /></ProtectedWithSidebar>} />
            <Route path="/ats-optimizer" element={<ProtectedWithSidebar><StandaloneOptimizer /></ProtectedWithSidebar>} />
            <Route path="/resume-preview" element={<ProtectedWithSidebar><ResumePreview /></ProtectedWithSidebar>} />
            <Route path="/profile" element={<ProtectedWithSidebar><Profile /></ProtectedWithSidebar>} />
            <Route path="/interview" element={<ProtectedWithSidebar><InterviewPractice /></ProtectedWithSidebar>} />
            <Route path="/interview/:sessionId" element={<ProtectedRoute><VoiceInterview /></ProtectedRoute>} />
            <Route path="/interview-report/:sessionId" element={<ProtectedWithSidebar><InterviewReport /></ProtectedWithSidebar>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
