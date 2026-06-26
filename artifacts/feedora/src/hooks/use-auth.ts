import { useState, useCallback } from "react";
import { User } from "@workspace/api-client-react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("feedora_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("feedora_token");
  });

  const login = useCallback((newUser: User, newToken: string) => {
    localStorage.setItem("feedora_user", JSON.stringify(newUser));
    localStorage.setItem("feedora_token", newToken);
    setUser(newUser);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("feedora_user");
    localStorage.removeItem("feedora_token");
    setUser(null);
    setToken(null);
  }, []);

  return { user, token, login, logout, isAuthenticated: !!token };
}
