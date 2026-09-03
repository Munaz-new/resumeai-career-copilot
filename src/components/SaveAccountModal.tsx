import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Check } from "lucide-react";
import { toast } from "sonner";
import { friendlyMessage } from "@/lib/friendlyError";

interface SaveAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function SaveAccountModal({
  open,
  onOpenChange,
  title = "Save your progress ✨",
  description = "You're using Guest Mode. Create a free account to unlock saving.",
}: SaveAccountModalProps) {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(friendlyMessage(error, "Google sign-in failed. Please try again."));
  };

  const benefits = [
    "Save resume history",
    "Access from any device",
    "Store ATS progress",
    "Resume where you left off",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="font-heading text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 my-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 pt-2">
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
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
          >
            Continue as Guest
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#fff" d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.227c1.887-1.737 2.986-4.295 2.986-7.35Z"/>
      <path fill="#fff" d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.227-2.51c-.895.6-2.04.955-3.391.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22Z" opacity=".95"/>
      <path fill="#fff" d="M6.402 13.9A6.01 6.01 0 0 1 6.09 12c0-.66.114-1.3.313-1.9V7.51H3.064A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.338-2.59Z" opacity=".85"/>
      <path fill="#fff" d="M12 5.977c1.468 0 2.786.505 3.823 1.496l2.867-2.867C16.96 2.99 14.696 2 12 2 8.09 2 4.713 4.244 3.064 7.51l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977Z" opacity=".75"/>
    </svg>
  );
}
