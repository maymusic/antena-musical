"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Session = {
  logged: boolean;
  email: string | null;
  artistId: number | null;
  artistSlug: string | null;
  role: string | null;
  loading: boolean;
};

type SessionCtx = {
  session: Session;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<SessionCtx>({
  session: { logged: false, email: null, artistId: null, artistSlug: null, role: null, loading: true },
  refresh: async () => {},
  logout: async () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({
    logged: false,
    email: null,
    artistId: null,
    artistSlug: null,
    role: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      if (!res.ok) {
        setSession({ logged: false, email: null, artistId: null, artistSlug: null, role: null, loading: false });
        return;
      }
      const data = await res.json();
      if (data.logged) {
        setSession({
          logged: true,
          email: data.email,
          artistId: data.artistId ?? null,
          artistSlug: data.artistSlug ?? null,
          role: data.role ?? "artist",
          loading: false,
        });
      } else {
        setSession({ logged: false, email: null, artistId: null, artistSlug: null, role: null, loading: false });
      }
    } catch {
      setSession((s) => ({ ...s, loading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setSession({ logged: false, email: null, artistId: null, artistSlug: null, role: null, loading: false });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ session, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useSession() {
  return useContext(Ctx);
}
