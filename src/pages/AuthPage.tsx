import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, ArrowRight, UserPlus, LogIn } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/SaveAccountModal";
import { friendlyMessage } from "@/lib/friendlyError";

export default function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(friendlyMessage(error));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error, needsConfirmation } = await signUp(email, password);
        if (error) {
          toast.error(friendlyMessage(error));
          return;
        }
        if (needsConfirmation) {
          setPendingConfirmEmail(email);
          toast.success("Account created! Check your email to confirm.");
        } else {
          toast.success("Account created — you're signed in!");
          navigate("/", { replace: true });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(friendlyMessage(error));
          if (error.message.toLowerCase().includes("confirm")) {
            setPendingConfirmEmail(email);
          }
          return;
        }
        toast.success("Signed in successfully!");
        navigate("/", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingConfirmEmail) return;
    setLoading(true);
    const { error } = await resendConfirmation(pendingConfirmEmail);
    setLoading(false);
    if (error) toast.error(friendlyMessage(error));
    else toast.success("Confirmation email sent — check your inbox.");
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto px-8 py-16">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your free account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signin"
              ? "Sign in to save your progress across devices."
              : "Save resume history, sync across devices, and pick up where you left off."}
          </p>
        </div>

        <div className="dashboard-card space-y-4 animate-fade-in">
          <Button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold py-5 rounded-xl"
          >
            <GoogleIcon className="w-4 h-4 mr-2" />
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="outline"
              className="w-full font-semibold py-5 rounded-xl"
            >
              {loading ? (
                "Please wait..."
              ) : mode === "signin" ? (
                <><LogIn className="w-4 h-4 mr-2" />Sign In with Email</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Create Account with Email</>
              )}
            </Button>

            {pendingConfirmEmail && (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="w-full text-sm text-primary hover:underline"
              >
                Resend confirmation email to {pendingConfirmEmail}
              </button>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setPendingConfirmEmail(null);
                }}
                className="text-sm text-primary hover:underline"
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center animate-fade-in">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Continue as Guest
          </button>
        </div>
      </div>
    </Layout>
  );
}
