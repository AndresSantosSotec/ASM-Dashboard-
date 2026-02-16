"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

export interface AllowedView {
  id: number;
  view_path: string;
  menu: string;
  icon: string;
  module: {
    name: string;
  };
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role?: {
    id: number;
    name: string;
  };
  role_id?: number;
}

interface AuthContextType {
  token: string | null;
  allowedViews: AllowedView[];
  user: UserInfo | null;
  setToken: (token: string | null) => void;
  setAllowedViews: (views: AllowedView[]) => void;
  setUser: (user: UserInfo | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  allowedViews: [],
  user: null,
  setToken: () => {},
  setAllowedViews: () => {},
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ chi
  const [user, setUserState] = useState<UserInfo | null>(null);ldren }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [allowedViews, setAllowedViewsState] = useState<AllowedView[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("token");
      const views = localStorage.getItem("allowedViews");
      setTokenState(stored);
      setAllowedViewsState(views ? JSON.parse(views) : []);
    }
  }, []);

  const setToken = (newToken: string | null) => {
    if (typeof window !== "undefined") {
      if (newToken) {
        localStorage.setItem("token", newToken);
      } else {
        localStorage.removeItem("token");
      }
    }
    setTokenState(newToken);
  };

  const setAllowedViews = (views: AllowedView[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("allowedViews", JSON.stringify(views));
    }
    setAllowedViewsState(views);
  };
const setUser = (userData: UserInfo | null) => {
    if (typeof window !== "undefined") {
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("user");
      }
    }
    setUserState(userData);
  };

  return (
    <AuthContext.Provider value={{ token, allowedViews, user, setToken, setAllowedViews, setUser
    <AuthContext.Provider value={{ token, allowedViews, setToken, setAllowedViews }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
