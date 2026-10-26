import { lazy, Suspense } from "react"
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useParams,
} from "react-router-dom"
import { AppShell } from "@/app/AppShell"
import { DomainLandingPage } from "@/app/pages/DomainLandingPage"
import { RouteErrorBoundary } from "@/app/errors/RouteErrorBoundary"
import { ToolErrorBoundary } from "@/app/errors/ToolErrorBoundary"
import {
  DashboardLoadingSkeleton,
  SystemPageLoadingSkeleton,
  ToolContentLoadingSkeleton,
} from "@/shared/components/layout/WorkspaceLoadingSkeleton"
import {
  ToolAvailabilityBadge,
  ToolAvailabilityPage,
  isToolBlocked,
} from "@/shared/components/tools/ToolAvailability"
import { getDomain, getTool } from "@/shared/config/registry"
import { AuthProvider } from "@/app/providers/AuthProvider"
import {
  LoginRedirect,
  RequireAdmin,
  RequireAuth,
  RequireSignedIn,
} from "@/app/routes/AuthGuards"
const AdminUsersPage = lazy(() =>
  import("@/app/pages/AdminUsersPage").then((module) => ({
    default: module.AdminUsersPage,
  }))
)

const LoginPage = lazy(() =>
  import("@/app/pages/AuthPages").then((module) => ({
    default: module.LoginPage,
  }))
)

const ChangePasswordPage = lazy(() =>
  import("@/app/pages/AuthPages").then((module) => ({
    default: module.ChangePasswordPage,
  }))
)

const HomePage = lazy(() =>
  import("@/app/pages/HomePage").then((module) => ({
    default: module.HomePage,
  }))
)

const NotFoundPage = lazy(() =>
  import("@/app/pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  }))
)

function DomainRoute() {
  const { domainId = "" } = useParams()
  return getDomain(domainId) ? (
    <DomainLandingPage />
  ) : (
    <Navigate to="/not-found" replace />
  )
}

function ToolRoute() {
  const { domainId = "", toolId = "", stepId } = useParams()
  const domain = getDomain(domainId)
  const tool = getTool(domainId, toolId)
  if (!tool || !domain) return <Navigate to="/not-found" replace />
  const Tool = tool.component
  const availability = tool.availability
  const blocked = availability ? isToolBlocked(availability.state) : false

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[.15em] text-primary uppercase">
          {domain.name} / {tool.category}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {tool.name}
          </h1>
          <ToolAvailabilityBadge availability={availability} />
        </div>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
      </header>
      {blocked && availability ? (
        <ToolAvailabilityPage
          toolName={tool.name}
          availability={availability}
        />
      ) : (
        <Suspense
          fallback={<ToolContentLoadingSkeleton toolName={tool.name} />}
        >
          <ToolErrorBoundary key={tool.id} toolName={tool.name}>
            <Tool domainId={domainId} toolId={toolId} stepId={stepId} />
          </ToolErrorBoundary>
        </Suspense>
      )}
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <LoginRedirect>
        <Suspense fallback={<SystemPageLoadingSkeleton />}>
          <LoginPage />
        </Suspense>
      </LoginRedirect>
    ),
  },
  {
    path: "/change-password",
    element: (
      <RequireSignedIn>
        <Suspense fallback={<SystemPageLoadingSkeleton />}>
          <ChangePasswordPage />
        </Suspense>
      </RequireSignedIn>
    ),
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<DashboardLoadingSkeleton />}>
            <HomePage />
          </Suspense>
        ),
      },
      { path: "domains/:domainId", element: <DomainRoute /> },
      { path: "domains/:domainId/tools/:toolId", element: <ToolRoute /> },
      {
        path: "domains/:domainId/tools/:toolId/steps/:stepId",
        element: <ToolRoute />,
      },
      {
        path: "admin/users",
        element: (
          <RequireAdmin>
            <Suspense
              fallback={
                <ToolContentLoadingSkeleton toolName="User management" />
              }
            >
              <AdminUsersPage />
            </Suspense>
          </RequireAdmin>
        ),
      },
      {
        path: "not-found",
        element: (
          <Suspense fallback={<DashboardLoadingSkeleton />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
      { path: "*", element: <Navigate to="/not-found" replace /> },
    ],
  },
])

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
