import { sileo, type SileoOptions } from "sileo"

function show(
  variant: "success" | "error" | "warning" | "info",
  title: string,
  description?: SileoOptions["description"]
) {
  sileo[variant]({ title, description })
}

/** App-wide transient feedback. Keep field-level and recoverable errors inline. */
export const notify = {
  success: (title: string, description?: SileoOptions["description"]) =>
    show("success", title, description),
  error: (title: string, description?: SileoOptions["description"]) =>
    show("error", title, description),
  warning: (title: string, description?: SileoOptions["description"]) =>
    show("warning", title, description),
  info: (title: string, description?: SileoOptions["description"]) =>
    show("info", title, description),
}
