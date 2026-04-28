import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

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
  // Inicializa lendo do localStorage para evitar a "amnésia" no F5
  const [user, setUser] = useState<Usuario | null>(() => {
    const userSalvo = localStorage.getItem("@gestor-faturas:user");
    if (userSalvo) {
      return JSON.parse(userSalvo);
    }
    return null;
  });

  const login = (dados: Usuario) => {
    setUser(dados);
    localStorage.setItem("@gestor-faturas:user", JSON.stringify(dados));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("@gestor-faturas:user");
  };

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
