import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export type RouteMode = "demo" | "home";

export const useRouteMode = (user: User | null): RouteMode => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "/demo";
    }
    return window.location.pathname;
  });

  const updatePath = useCallback((nextPath: string) => {
    if (typeof window === "undefined") {
      return;
    }

    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, "", nextPath);
    }
    setCurrentPath(nextPath);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const desiredPath = user ? "/home" : "/demo";
    if (currentPath !== desiredPath) {
      updatePath(desiredPath);
    }
  }, [user, currentPath, updatePath]);

  return currentPath === "/demo" ? "demo" : "home";
};
