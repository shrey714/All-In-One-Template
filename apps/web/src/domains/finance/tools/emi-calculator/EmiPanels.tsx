import { useSearchParams } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { calculateEmi } from "@/domains/finance/tools/emi-calculator/utils/calculate-emi"

function useLoan() {
  const [params] = useSearchParams()
  const amount = Number(params.get("amount") ?? 2500000)
  const rate = Number(params.get("rate") ?? 8.5)
  const years = Number(params.get("years") ?? 20)
  const months = Math.max(1, years * 12)
  const payment = calculateEmi({ principal: amount, annualRate: rate, years })
  return { amount, rate, years, months, payment }
}

const currency = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`

export function EmiInsightsPanel() {
  const { amount, rate, years, months, payment } = useLoan()
  const total = payment * months
  const interest = total - amount
  const ratio = total > 0 ? (interest / total) * 100 : 0
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Loan snapshot</CardTitle>
          <CardDescription>
            Live summary of the current estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <Metric label="Monthly payment" value={currency(payment)} />
          <Metric label="Principal" value={currency(amount)} />
          <Metric label="Total interest" value={currency(interest)} />
          <Metric label="Total repayment" value={currency(total)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Interest share</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${Math.min(100, ratio)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {ratio.toFixed(1)}% of total repayment is interest.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {rate}% p.a. over {years} years ({months} payments)
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function EmiAmortizationPanel() {
  const { amount, rate, months, payment } = useLoan()
  const monthlyRate = rate / 1200
  const rows = Array.from({ length: Math.min(months, 12) }).reduce<
    {
      month: number
      payment: number
      principal: number
      interest: number
      balance: number
    }[]
  >((schedule, _, index) => {
    const previousBalance = schedule[index - 1]?.balance ?? amount
    const interest = previousBalance * monthlyRate
    const principal = Math.min(previousBalance, payment - interest)
    const balance = Math.max(0, previousBalance - principal)
    schedule.push({
      month: index + 1,
      payment: principal + interest,
      principal,
      interest,
      balance,
    })
    return schedule
  }, [])
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-md border">
      <table className="w-full table-fixed text-left text-[10px] sm:text-xs">
        <thead className="sticky top-0 bg-muted/70 text-muted-foreground">
          <tr>
            {["Month", "Payment", "Principal", "Interest", "Balance"].map(
              (label) => (
                <th
                  key={label}
                  className="px-2 py-2 font-medium break-words sm:px-3"
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className="border-t">
              <td className="px-2 py-2 break-words tabular-nums sm:px-3">
                {row.month}
              </td>
              <td className="px-2 py-2 break-words tabular-nums sm:px-3">
                {currency(row.payment)}
              </td>
              <td className="px-2 py-2 break-words tabular-nums sm:px-3">
                {currency(row.principal)}
              </td>
              <td className="px-2 py-2 break-words tabular-nums sm:px-3">
                {currency(row.interest)}
              </td>
              <td className="px-2 py-2 break-words tabular-nums sm:px-3">
                {currency(row.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        Showing the first {rows.length} of {months} monthly payments.
      </p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right tabular-nums">{value}</strong>
    </div>
  )
}
