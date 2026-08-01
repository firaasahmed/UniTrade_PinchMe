import { useState } from "react";

// seeded reviewer account — every seeded user shares this password
const DEMO = { email: "admin@pinch.edu.au", password: "admin" };
import { useSession } from "@/session/SessionContext";
import { UniTradeLogo } from "@/ui/brand/UniTradeLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordProblem } from "@/utils/password";
import { ShieldCheck, Eye, EyeOff, Check, X } from "lucide-react";

export function AuthPage({
  mode,
  onDone,
  onSwitchMode,
}: {
  mode: "register" | "login";
  onDone: () => void;
  onSwitchMode: (mode: "register" | "login") => void;
}) {
  const { register, login } = useSession();
  const [name, setName] = useState("");
  // the demo account, filled in so a reviewer can sign straight in. registering
  // starts blank, since those are real details
  const [email, setEmail] = useState(mode === "login" ? DEMO.email : "");
  const [password, setPassword] = useState(mode === "login" ? DEMO.password : "");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isRegister) {
      const problem = passwordProblem(password);
      if (problem) {
        setError(problem);
        return;
      }
      if (password !== confirm) {
        setError("those passwords don't match");
        return;
      }
    }

    setBusy(true);
    try {
      if (isRegister) await register({ name, email, password });
      else await login(email, password);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
      setBusy(false);
    }
  }

  function switchTo(next: "register" | "login") {
    setError(null);
    setPassword("");
    setConfirm("");
    onSwitchMode(next);
  }

  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <UniTradeLogo />
        <h1 className="mt-4 font-heading text-2xl font-semibold">
          {isRegister ? "Join UniTrade" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRegister
            ? "Verify with your university email to buy and sell safely."
            : "Sign in with your university email."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        {isRegister && (
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="email">University email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@student.uni.edu.au"
            autoComplete="email"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={reveal ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label={reveal ? "Hide password" : "Show password"}
            >
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {isRegister && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={reveal ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <PasswordRules password={password} />
          </>
        )}

        {isRegister && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-verified" />
            A recognised .edu.au address gets you a verified badge.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => switchTo(isRegister ? "login" : "register")}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {isRegister ? "Sign in" : "Sign up / Register"}
          </button>
        </p>
      </form>
    </div>
  );
}

// live checklist so the rules aren't a surprise on submit
function PasswordRules({ password }: { password: string }) {
  const rules = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "A number", ok: /\d/.test(password) },
    { label: "A special character", ok: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`';]/.test(password) },
  ];
  return (
    <ul className="space-y-1">
      {rules.map((r) => (
        <li
          key={r.label}
          className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-verified" : "text-muted-foreground"}`}
        >
          {r.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
          {r.label}
        </li>
      ))}
    </ul>
  );
}
