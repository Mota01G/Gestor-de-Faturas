import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import FaturasList from "@/pages/FaturasList";
import FaturaCreate from "@/pages/FaturaCreate";
import FaturaDetail from "@/pages/FaturaDetail";
import NotFound from "./pages/NotFound.tsx";

// Nossos novos imports!
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

// O "Guarda-Costas": Se não estiver logado, chuta para a tela de login
const RotaProtegida = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* 1. Envolvemos tudo com o Provedor de Autenticação */}
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* 2. Rota Pública: Qualquer um pode acessar */}
            <Route path="/login" element={<Login />} />

            {/* 3. Rotas Privadas: Protegidas pela nossa cerca */}
            <Route
              path="/*"
              element={
                <RotaProtegida>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/faturas" element={<FaturasList />} />
                      <Route path="/faturas/nova" element={<FaturaCreate />} />
                      <Route path="/faturas/:id" element={<FaturaDetail />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </RotaProtegida>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
