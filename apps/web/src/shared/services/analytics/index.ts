export type AnalyticsEvent = { name: string; properties?: Record<string, string | number | boolean> }
export interface AnalyticsAdapter { track(event: AnalyticsEvent): void }
const noopAdapter: AnalyticsAdapter = { track: () => undefined }
let adapter: AnalyticsAdapter = noopAdapter
export function configureAnalytics(next: AnalyticsAdapter) { adapter = next }
export function trackEvent(event: AnalyticsEvent) { adapter.track(event) }
