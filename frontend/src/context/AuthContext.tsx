/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import { getEmployeeByID } from "../services/api/employees";
import type { Token, EmployeeRow, EmployeeUserInfo } from "../types";

interface AuthPayload extends JwtPayload {
  data: {
    id: EmployeeRow["id"],
    rol: EmployeeUserInfo["rol"]
  }
}

function hasValidAuthData(payload: unknown): payload is AuthPayload {
  if (!payload || typeof payload !== "object") return false;
  const maybePayload = payload as Partial<AuthPayload>;
  const id = maybePayload.data?.id;
  return typeof id === "number" && Number.isFinite(id);
}

interface IAuthContext {
  user: EmployeeRow | null;
  // eslint-disable-next-line no-unused-vars
  authenticate: ({ access_token }: Token) => Promise<EmployeeRow>
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmployeeRow | null>(null);
  const [loading, setLoading] = useState(true);

  const handleGetEmployeeData = async (access_token: string): Promise<EmployeeRow> => {
    const decoded = jwtDecode<AuthPayload>(access_token);

    if (!hasValidAuthData(decoded)) {
      throw new Error("Token inválido o con formato inesperado.");
    }

    const employee = await getEmployeeByID(decoded.data.id)
    return employee.data.data;
  }

  useEffect(() => {
    const access_token = localStorage.getItem("access_token");
    if (!access_token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const employee = await handleGetEmployeeData(access_token);
        setUser(employee);
      } catch (error) {
        console.error("Error restaurando sesión", error);
        localStorage.removeItem("access_token");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const authenticate = async ({ access_token }: Token) => {
    localStorage.setItem("access_token", access_token);
    try {
      const employee = await handleGetEmployeeData(access_token);
      setUser(employee);
      return employee;
    } catch (error) {
      localStorage.removeItem("access_token");
      throw error;
    }
  }

  const logout = () => {
    setUser(null);
    localStorage.removeItem("access_token");
  };

  return (
    <AuthContext.Provider value={{ user, authenticate, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}