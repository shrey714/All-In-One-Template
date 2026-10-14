import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { calculateEmi } from "@/domains/finance/tools/emi-calculator/utils/calculate-emi"

export function EmiCalculator() {
  const [params, setParams] = useSearchParams()
  const value = (key: string, fallback: number) => params.has(key) ? Number(params.get(key)) : fallback
  const principal = value("amount", 2500000)
  const annualRate = value("rate", 8.5)
  const years = value("years", 20)
  const months = years * 12
  const monthly = useMemo(() => calculateEmi({ principal, annualRate, years }), [annualRate, principal, years])
  const change = (key: string, value: number) => { const next = new URLSearchParams(params); next.set(key, String(value)); setParams(next, { replace: true }) }
  const fields = [
    { key: "amount", label: "Loan amount", value: principal, min: 10000, max: 100000000, step: 10000, suffix: "₹" },
    { key: "rate", label: "Annual interest rate", value: annualRate, min: 0, max: 30, step: 0.1, suffix: "% p.a." },
    { key: "years", label: "Loan term", value: years, min: 1, max: 40, step: 1, suffix: "years" },
  ]
  return <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
    <Card><CardHeader><CardTitle>Loan details</CardTitle><CardDescription>Change any value; the shareable URL updates as you go.</CardDescription></CardHeader><CardContent className="space-y-5">
      {fields.map(field => <div key={field.key} className="space-y-2"><Label htmlFor={`emi-${field.key}`}>{field.label}</Label><span className="flex items-center rounded-xl border bg-background px-3"><Input id={`emi-${field.key}`} className="h-11 min-w-0 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" type="number" min={field.min} max={field.max} step={field.step} value={field.value} onChange={event => change(field.key, Number(event.target.value))}/><span className="text-sm text-muted-foreground">{field.suffix}</span></span></div>)}
      <Button variant="outline" onClick={() => setParams({ amount: "2500000", rate: "8.5", years: "20" })}>Restore example values</Button>
    </CardContent></Card>
    <Card className="overflow-hidden"><div className="bg-gradient-to-br from-violet-700 to-indigo-500 p-7 text-white"><p className="text-sm text-white/75">Estimated monthly payment</p><p className="mt-2 text-4xl font-semibold tracking-tight">₹{Math.round(monthly).toLocaleString("en-IN")}</p><p className="mt-2 text-sm text-white/75">{years} years · {annualRate}% p.a.</p></div><CardContent className="space-y-4 pt-6"><Summary label="Principal" value={principal}/><Summary label="Total interest" value={Math.round(monthly * months - principal)}/><div className="flex justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">Total repayment</span><strong>₹{Math.round(monthly * months).toLocaleString("en-IN")}</strong></div></CardContent></Card>
  </div>
}
function Summary({ label, value }: { label: string; value: number }) { return <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><strong>₹{value.toLocaleString("en-IN")}</strong></div> }
