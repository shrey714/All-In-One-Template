import { getToolSettingsStorageKey } from "@/shared/config/tool-settings-storage"

export type EmiCalculatorPreferences = {
  defaultAmount: number
  defaultAnnualRate: number
  defaultYears: number
}

export const defaultEmiCalculatorPreferences: EmiCalculatorPreferences = {
  defaultAmount: 2_500_000,
  defaultAnnualRate: 8.5,
  defaultYears: 20,
}

export const getEmiCalculatorSettingsKey = () =>
  getToolSettingsStorageKey("finance", "emi-calculator")
