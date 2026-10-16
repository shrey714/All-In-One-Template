import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { usePersistentState } from "@/shared/hooks/usePersistentState"
import { getToolSettingsStorageKey } from "@/shared/config/tool-settings-storage"
import type { ToolSettingsPanelContext } from "@/shared/types/tool"
import { defaultPomodoroPreferences } from "@/domains/productivity/tools/pomodoro-timer/settings"

export function PomodoroSettingsPanel({
  domainId,
  toolId,
}: ToolSettingsPanelContext) {
  const [preferences, setPreferences] = usePersistentState(
    getToolSettingsStorageKey(domainId, toolId),
    defaultPomodoroPreferences
  )

  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        The focus duration is used for new sessions and when you reset the
        timer.
      </div>
      <div className="flex items-center justify-between gap-6 py-2">
        <div className="min-w-0 space-y-1">
          <Label
            htmlFor="pomodoro-focus-duration"
            className="text-[13px] font-medium"
          >
            Focus duration
          </Label>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Length of one focus interval before the timer completes.
          </p>
        </div>
        <div className="flex w-48 shrink-0 items-center gap-2">
          <Input
            id="pomodoro-focus-duration"
            type="number"
            min={5}
            max={120}
            step={5}
            value={preferences.focusMinutes}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) {
                setPreferences((current) => ({
                  ...current,
                  focusMinutes: value,
                }))
              }
            }}
            className="h-8 text-xs tabular-nums"
          />
          <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground">
            minutes
          </span>
        </div>
      </div>
    </div>
  )
}
