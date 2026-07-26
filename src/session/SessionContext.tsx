import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SessionUser, UserPatch } from "@/types/User";
import { getMe } from "@/api/session-api";
import { register as apiRegister, login as apiLogin, type RegisterInput } from "@/api/auth-api";
import { updateMe as apiUpdateMe } from "@/api/users-api";
import { getSessionToken, setSessionToken } from "@/utils/session-store";

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: SessionUser };

type SessionContextValue = {
  state: SessionState;
  register: (input: RegisterInput) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  updateUser: (patch: UserPatch) => Promise<void>;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(() =>
    getSessionToken() ? { status: "loading" } : { status: "signedOut" },
  );

  // a stored token is only a claim — the server decides whether it still stands
  useEffect(() => {
    if (state.status !== "loading") return;
    let active = true;
    getMe()
      .then((user) => {
        if (active) setState({ status: "signedIn", user });
      })
      .catch(() => {
        if (active) {
          setSessionToken(null);
          setState({ status: "signedOut" });
        }
      });
    return () => {
      active = false;
    };
  }, [state.status]);

  const value: SessionContextValue = {
    state,
    register: async (input) => {
      const { token, user } = await apiRegister(input);
      setSessionToken(token);
      setState({ status: "signedIn", user });
    },
    login: async (email, password) => {
      const { token, user } = await apiLogin(email, password);
      setSessionToken(token);
      setState({ status: "signedIn", user });
    },
    updateUser: async (patch) => {
      const user = await apiUpdateMe(patch);
      setState({ status: "signedIn", user });
    },
    signOut: () => {
      setSessionToken(null);
      setState({ status: "signedOut" });
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
