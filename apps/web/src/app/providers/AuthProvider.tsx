import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { ApiError, requestApi } from "@/shared/services/auth-api"
import type { AuthUser } from "@/shared/types/auth"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Clock3 } from "lucide-react"

type AuthStatus = "loading" | "authenticated" | "anonymous" | "error"
type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  authEnabled: boolean
  refresh: () => Promise<void>
  login: (username: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  changePassword: (
    currentPassword: string | undefined,
    newPassword: string
  ) => Promise<AuthUser>
}

const authConfig = __ORBIT_CONFIG__.auth
const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    authConfig.enabled ? "loading" : "anonymous"
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  const [lastActivity, setLastActivity] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [idleExpired, setIdleExpired] = useState(false)
  const lastHeartbeatRef = useRef(0)
  const idleLogoutStartedRef = useRef(false)

  const loadSession = useCallback(async () => {
    if (!authConfig.enabled) {
      setUser(null)
      setStatus("anonymous")
      return true
    }
    try {
      const result = await requestApi<{ user: AuthUser }>("/api/auth/me")
      setUser(result.user)
      setStatus("authenticated")
      setIdleExpired(false)
      idleLogoutStartedRef.current = false
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        setStatus("anonymous")
        setIdleExpired(error.message.toLowerCase().includes("inactivity"))
      } else {
        setUser(null)
        setStatus("error")
      }
      return false
    }
  }, [])

  const refresh = useCallback(async () => {
    setStatus(authConfig.enabled ? "loading" : "anonymous")
    await loadSession()
  }, [loadSession])

  useEffect(() => {
    if (authConfig.enabled) {
      // Initial session lookup is asynchronous; state updates happen after its response.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadSession()
    }
  }, [loadSession])

  const login = useCallback(async (username: string, password: string) => {
    const result = await requestApi<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    setUser(result.user)
    setStatus("authenticated")
    setLastActivity(Date.now())
    setIdleExpired(false)
    idleLogoutStartedRef.current = false
    return result.user
  }, [])

  const logout = useCallback(async () => {
    try {
      if (authConfig.enabled) {
        await requestApi<void>("/api/auth/logout", { method: "POST" })
      }
    } finally {
      setUser(null)
      setStatus("anonymous")
    }
  }, [])

  const changePassword = useCallback(
    async (currentPassword: string | undefined, newPassword: string) => {
      const result = await requestApi<{ user: AuthUser }>(
        "/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      )
      setUser(result.user)
      setStatus("authenticated")
      setLastActivity(Date.now())
      return result.user
    },
    []
  )

  const idleTimeoutMs = authConfig.inactivityTimeoutMinutes * 60_000
  const warningLeadMs = Math.min(
    authConfig.warningBeforeTimeoutSeconds * 1000,
    Math.max(10_000, idleTimeoutMs / 2)
  )
  const idleElapsed = Math.max(0, now - lastActivity)
  const showIdleWarning =
    authConfig.enabled &&
    idleTimeoutMs > 0 &&
    status === "authenticated" &&
    idleElapsed >= idleTimeoutMs - warningLeadMs &&
    !idleExpired
  const secondsRemaining = Math.max(
    0,
    Math.ceil((idleTimeoutMs - idleElapsed) / 1000)
  )

  useEffect(() => {
    if (!authConfig.enabled || !user || idleTimeoutMs <= 0) return
    const updateClock = () => setNow(Date.now())
    const handleActivity = () => {
      if (idleExpired) return
      const timestamp = Date.now()
      if (timestamp - lastActivity >= idleTimeoutMs - warningLeadMs) return
      setLastActivity(timestamp)
      setNow(timestamp)
      if (timestamp - lastHeartbeatRef.current >= 30_000) {
        lastHeartbeatRef.current = timestamp
        void loadSession()
      }
    }
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ]
    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    )
    const timer = window.setInterval(updateClock, 1000)
    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      )
      window.clearInterval(timer)
    }
  }, [
    idleExpired,
    idleTimeoutMs,
    lastActivity,
    loadSession,
    user,
    warningLeadMs,
  ])

  useEffect(() => {
    if (
      !showIdleWarning ||
      secondsRemaining > 0 ||
      idleExpired ||
      idleLogoutStartedRef.current
    )
      return
    idleLogoutStartedRef.current = true
    void logout().catch(() => undefined)
  }, [idleExpired, logout, secondsRemaining, showIdleWarning])

  const staySignedIn = async () => {
    const sessionValid = await loadSession()
    if (sessionValid) {
      const timestamp = Date.now()
      setLastActivity(timestamp)
      setNow(timestamp)
      lastHeartbeatRef.current = timestamp
    }
  }

  const value = useMemo(
    () => ({
      status,
      user,
      authEnabled: authConfig.enabled,
      refresh,
      login,
      logout,
      changePassword,
    }),
    [status, user, refresh, login, logout, changePassword]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Dialog open={showIdleWarning}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock3 className="size-4 text-amber-500" />
              Still there?
            </DialogTitle>
            <DialogDescription>
              You’ll be signed out in {formatRemaining(secondsRemaining)}{" "}
              because of inactivity. Choose “Stay signed in” to continue your
              session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => void logout().catch(() => undefined)}
            >
              Sign out now
            </Button>
            <Button onClick={() => void staySignedIn()}>Stay signed in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  )
}

function formatRemaining(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider.")
  return value
}
