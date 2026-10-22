import { useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

export function CompoundGrowth() {
  const [principal, setPrincipal] = useState(100000)
  const [monthly, setMonthly] = useState(5000)
  const [rate, setRate] = useState(8)
  const [years, setYears] = useState(10)
  const result = useMemo(() => {
    const months = years * 12
    const monthlyRate = rate / 100 / 12
    const contributions = monthly * months
    const invested = principal + contributions
    const futureValue =
      monthlyRate === 0
        ? invested
        : principal * (1 + monthlyRate) ** months +
          monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate)
    return { invested, futureValue, growth: futureValue - invested }
  }, [monthly, principal, rate, years])
  const fields = [
    {
      label: "Initial amount",
      value: principal,
      set: setPrincipal,
      min: 0,
      max: 100000000,
      step: 10000,
    },
    {
      label: "Monthly contribution",
      value: monthly,
      set: setMonthly,
      min: 0,
      max: 1000000,
      step: 500,
    },
    {
      label: "Annual return",
      value: rate,
      set: setRate,
      min: 0,
      max: 50,
      step: 0.1,
    },
    {
      label: "Time period (years)",
      value: years,
      set: setYears,
      min: 1,
      max: 60,
      step: 1,
    },
  ]

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>Compound growth calculator</CardTitle>
          <CardDescription>
            Explore how regular contributions and compounding may grow over
            time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {fields.map((field, index) => (
            <div key={field.label} className="space-y-2">
              <Label htmlFor={`growth-${index}`}>{field.label}</Label>
              <Input
                id={`growth-${index}`}
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={field.value}
                onChange={(event) => field.set(Number(event.target.value))}
              />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-700 to-teal-500 p-6 text-white">
          <TrendingUp className="size-5" />
          <p className="mt-4 text-sm text-white/80">Estimated future value</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {formatCurrency(result.futureValue)}
          </p>
          <p className="mt-2 text-xs text-white/75">
            Illustrative estimate, not financial advice.
          </p>
        </div>
        <CardContent className="space-y-3 pt-5">
          {[
            ["Amount invested", result.invested],
            ["Estimated growth", result.growth],
          ].map(([label, amount]) => (
            <div
              key={String(label)}
              className="flex justify-between gap-3 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <strong>{formatCurrency(Number(amount))}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
