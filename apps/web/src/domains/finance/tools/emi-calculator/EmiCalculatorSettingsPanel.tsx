import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { usePersistentState } from "@/shared/hooks/usePersistentState"
import { getToolSettingsStorageKey } from "@/shared/config/tool-settings-storage"
import type { ToolSettingsPanelContext } from "@/shared/types/tool"
import { defaultEmiCalculatorPreferences } from "@/domains/finance/tools/emi-calculator/settings"

const fields = [
  {
    key: "defaultAmount",
    label: "Default loan amount",
    description:
      "Amount prefilled when the calculator URL has no amount value.",
    min: 10_000,
    max: 100_000_000,
    step: 10_000,
    suffix: "₹",
  },
  {
    key: "defaultAnnualRate",
    label: "Default annual interest rate",
    description: "Annual rate prefilled when the URL has no rate value.",
    min: 0,
    max: 30,
    step: 0.1,
    suffix: "% p.a.",
  },
  {
    key: "defaultYears",
    label: "Default loan term",
    description: "Loan term prefilled when the URL has no years value.",
    min: 1,
    max: 40,
    step: 1,
    suffix: "years",
  },
] as const

export function EmiCalculatorSettingsPanel({
  domainId,
  toolId,
}: ToolSettingsPanelContext) {
  const [preferences, setPreferences] = usePersistentState(
    getToolSettingsStorageKey(domainId, toolId),
    defaultEmiCalculatorPreferences
  )

  return (
    <div className="space-y-5">
      <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        These defaults are used when a calculator URL does not specify a value.
        Shared URLs with explicit values continue to take precedence.
      </div>
      <div className="divide-y divide-border/60">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between gap-6 py-4 first:pt-1 last:pb-1"
          >
            <div className="min-w-0 space-y-1">
              <Label
                htmlFor={`emi-setting-${field.key}`}
                className="text-[13px] font-medium"
              >
                {field.label}
              </Label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {field.description}
              </p>
            </div>
            <div className="flex w-48 shrink-0 items-center gap-2">
              <Input
                id={`emi-setting-${field.key}`}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={preferences[field.key]}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (!Number.isFinite(value)) return
                  setPreferences((current) => ({
                    ...current,
                    [field.key]: value,
                  }))
                }}
                className="h-8 text-xs tabular-nums"
              />
              <span className="w-14 shrink-0 text-right text-[11px] text-muted-foreground">
                {field.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
