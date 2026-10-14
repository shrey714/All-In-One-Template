import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate, RouterProvider, useParams } from "react-router-dom"
import { AppShell } from "@/app/AppShell"
import { DomainLandingPage } from "@/app/pages/DomainLandingPage"
import { RouteErrorBoundary } from "@/app/errors/RouteErrorBoundary"
import { getDomain, getTool } from "@/shared/config/registry"
const HomePage = lazy(() => import("@/app/pages/HomePage").then(module => ({ default: module.HomePage })))
function DomainRoute() { const { domainId = "" } = useParams(); return getDomain(domainId) ? <DomainLandingPage/> : <Navigate to="/not-found" replace/> }
function ToolRoute() { const { domainId = "", toolId = "", stepId } = useParams(); const domain = getDomain(domainId); const tool = getTool(domainId, toolId); if (!tool || !domain) return <Navigate to="/not-found" replace/>; const Tool = tool.component; return <div className="space-y-6"><header className="space-y-2"><p className="text-xs font-medium uppercase tracking-[.15em] text-primary">{domain.name} / {tool.category}</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{tool.name}</h1><p className="text-sm text-muted-foreground">{tool.description}</p></header><Tool domainId={domainId} toolId={toolId} stepId={stepId}/></div> }
function NotFound() { return <div className="mx-auto max-w-xl rounded-2xl border bg-card p-10 text-center"><h1 className="text-2xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-muted-foreground">That route does not match a registered page, domain, or tool.</p><a className="mt-4 inline-block text-primary underline" href="/">Return to dashboard</a></div> }
const router = createBrowserRouter([{ path: "/", element: <AppShell/>, errorElement: <RouteErrorBoundary/>, children: [{ index: true, element: <Suspense fallback={<div className="p-8 text-muted-foreground">Loading dashboard…</div>}><HomePage/></Suspense> }, { path: "domains/:domainId", element: <DomainRoute/> }, { path: "domains/:domainId/tools/:toolId", element: <ToolRoute/> }, { path: "domains/:domainId/tools/:toolId/steps/:stepId", element: <ToolRoute/> }, { path: "not-found", element: <NotFound/> }, { path: "*", element: <Navigate to="/not-found" replace/> }] }])
export function App() { return <RouterProvider router={router}/> }
