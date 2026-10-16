import { timerConfig } from "@/domains/productivity/tools/pomodoro-timer/config/timer-config"
import { getToolSettingsStorageKey } from "@/shared/config/tool-settings-storage"

export type PomodoroPreferences = {
  focusMinutes: number
}

export const defaultPomodoroPreferences: PomodoroPreferences = {
  focusMinutes: timerConfig.focusSeconds / 60,
}

export const getPomodoroSettingsKey = () =>
  getToolSettingsStorageKey("productivity", "pomodoro-timer")
