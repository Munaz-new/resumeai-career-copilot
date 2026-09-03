import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function friendlyAuthError(err: { message?: string; code?: string; status?: number } | null): Error | null {
  if (!err) return null;
  const msg = (err.message || "").toLowerCase();
  const code = (err as any).code as string | undefined;

  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return new Error("That email or password doesn't look right.");
  }
  if (msg.includes("user not found") || code === "user_not_found") {
    return new Error("We couldn't find an account with this email.");
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return new Error("Please confirm your email — check your inbox for the confirmation link.");
  }
  if (code === "user_already_exists" || msg.includes("already registered") || msg.includes("user already")) {
    return new Error("An account with this email already exists. Try signing in instead.");
  }
  if (code === "weak_password" || msg.includes("password should be")) {
    return new Error("Password is too weak. Use at least 6 characters and avoid common passwords.");
  }
  if (code === "over_email_send_rate_limit" || msg.includes("rate limit")) {
    return new Error("Too many attempts. Please wait a minute and try again.");
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return new Error("Network error. Check your connection and try again.");
  }
  return new Error(err.message || "Something went wrong. Please try again.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) {
      return { error: friendlyAuthError(error) };
    }
    return {
      error: null,
      needsConfirmation: !data?.session,
    };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: friendlyAuthError(error) };
  };

  const signInWithGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        return { error: new Error(result.error.message || "Google sign-in failed. Please try again.") };
      }
      return { error: null };
    } catch (e) {
      return { error: new Error((e as Error)?.message || "Google sign-in failed. Please try again.") };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error: friendlyAuthError(error) };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, resendConfirmation, isGuest: !user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
