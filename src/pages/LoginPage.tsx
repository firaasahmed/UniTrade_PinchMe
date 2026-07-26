import { useNavigate, useLocation } from "react-router-dom";
import { AuthPage } from "@/ui/auth/AuthPage";

type LocationState = { from?: string } | null;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState)?.from ?? "/";
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <AuthPage
        mode="login"
        onDone={() => navigate(from, { replace: true })}
        onSwitchMode={() => navigate("/register", { state: location.state })}
      />
    </div>
  );
}
