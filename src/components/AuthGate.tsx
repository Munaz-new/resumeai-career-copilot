import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "./SaveAccountModal";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/friendlyError";

interface AuthGateProps {
  children: React.ReactNode;
  message?: string;
}

export function AuthGate({ children, message }: AuthGateProps) {
  const { isGuest, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(friendlyMessage(error, "Google sign-in failed. Please try again."));
  };

  if (isGuest) {
    const benefits = [
      "Save resume history",
      "Access from any device",
      "Store ATS progress",
      "Resume where you left off",
    ];

    return (
      <div className="dashboard-card max-w-md mx-auto py-10 px-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-heading text-xl font-bold text-foreground mb-2">Save your progress ✨</h3>
        <p className="text-sm text-muted-foreground mb-5">
          {message || "Create a free account to unlock saving and history."}
        </p>

        <ul className="space-y-2 mb-5 text-left max-w-xs mx-auto">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <Button
            onClick={handleGoogle}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold py-5 rounded-xl"
          >
            <GoogleIcon className="w-4 h-4 mr-2" />
            Continue with Google
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            variant="outline"
            className="w-full font-semibold py-5 rounded-xl"
          >
            <Mail className="w-4 h-4 mr-2" />
            Continue with Email
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
