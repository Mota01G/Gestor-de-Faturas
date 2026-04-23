import React, { createContext, useContext, useState, ReactNode } from "react";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  cargo: "GESTOR" | "CONTROLADORIA" | "ADMIN";
};

interface AuthContextType {
  user: Usuario | null;
  login: (dados: Usuario) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);

  const login = (dados: Usuario) => setUser(dados);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};
