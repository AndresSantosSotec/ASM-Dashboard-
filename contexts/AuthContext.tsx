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

interface AuthContextType {
  token: string | null;
  allowedViews: AllowedView[];
  setToken: (token: string | null) => void;
  setAllowedViews: (views: AllowedView[]) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  allowedViews: [],
  setToken: () => {},
  setAllowedViews: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return (
    <AuthContext.Provider value={{ token, allowedViews, setToken, setAllowedViews }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
