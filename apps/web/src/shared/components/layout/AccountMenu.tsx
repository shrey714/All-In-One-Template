import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { KeyRound, LogOut, Shield, UserRound, Users } from "lucide-react"
import { useAuth } from "@/app/providers/AuthProvider"

export function AccountMenu({ className = "" }: { className?: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  if (!user) return null
  const initials =
    user.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || user.username.slice(0, 2).toUpperCase()

  const signOut = async () => {
    setError("")
    try {
      await logout()
      navigate("/login", { replace: true })
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not sign out."
      )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${className}`}
          title={`Account: ${user.displayName}`}
          aria-label={`Account menu for ${user.displayName}`}
        >
          <span className="grid size-7 place-items-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            {initials}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block truncate text-foreground">
            {user.displayName}
          </span>
          <span className="block truncate font-normal">
            @{user.username} · {user.role === "admin" ? "Admin" : "Member"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link to="/admin/users">
              <Users />
              <span>Manage users</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/change-password">
            <KeyRound />
            <span>Change password</span>
          </Link>
        </DropdownMenuItem>
        {error && (
          <DropdownMenuLabel className="whitespace-normal text-destructive">
            {error}
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault()
            void signOut()
          }}
        >
          {user.role === "admin" ? <Shield /> : <UserRound />}
          <span>Sign out</span>
          <LogOut className="ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
