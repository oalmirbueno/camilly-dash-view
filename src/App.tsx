import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Mensagens from "./pages/Mensagens";
import Erros from "./pages/Erros";
import Rotas from "./pages/Rotas";
import Templates from "./pages/Templates";
import Links from "./pages/Links";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mensagens" element={<Mensagens />} />
            <Route path="/entregas" element={<Navigate to="/mensagens" replace />} />
            <Route path="/erros" element={<Erros />} />
            <Route path="/rotas" element={<Rotas />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/links" element={<Links />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
