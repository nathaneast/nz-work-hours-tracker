import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";

const LocalhostRedirectUrl = "http://localhost:3000/home";
const DevHost = "nz-work-hours-tracker-dev.netlify.app";
const ProdHost = "nz-work-hours-tracker-prod.netlify.app";
const DevRedirectUrl = `https://${DevHost}/home`;
const ProdRedirectUrl = `https://${ProdHost}/home`;

type UseAuthSessionResult = {
  user: User | null;
  isAuthLoading: boolean;
  authError: string | null;
  handleSignIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
};

export const useAuthSession = (): UseAuthSessionResult => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) {
          setUser(data.session?.user ?? null);
        }
      } catch (error_) {
        if (isMounted) {
          setAuthError((error_ as Error).message);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    void initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setAuthError("Supabase 환경변수가 설정되지 않았습니다.");
      return;
    }

    setAuthError(null);

    const resolveRedirectUrl = () => {
      const origin = window.location.origin;
      if (origin.includes("localhost")) {
        return LocalhostRedirectUrl;
      }
      if (origin.includes(DevHost)) {
        return DevRedirectUrl;
      }
      if (origin.includes(ProdHost)) {
        return ProdRedirectUrl;
      }
      return `${origin}/home`;
    };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: resolveRedirectUrl(),
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    isAuthLoading,
    authError,
    handleSignIn,
    handleSignOut,
  };
};
