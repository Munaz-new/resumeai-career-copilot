import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "./pages/HomePage";
import AnalyzerPage from "./pages/AnalyzerPage";
import BuilderPage from "./pages/BuilderPage";
import InterviewPage from "./pages/InterviewPage";
import RoadmapPage from "./pages/RoadmapPage";
import ProfilePage from "./pages/ProfilePage";
import SkillsPage from "./pages/SkillsPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import ComparePage from "./pages/ComparePage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="resumeai-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/builder" element={<BuilderPage />} />
              <Route path="/analyzer" element={<AnalyzerPage />} />
              <Route path="/analysis" element={<AnalyzerPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/suggestions" element={<SuggestionsPage />} />
              <Route path="/interview" element={<InterviewPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/roadmap" element={<RoadmapPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
