export type EmiInputs = { principal: number; annualRate: number; years: number }
export function calculateEmi({ principal, annualRate, years }: EmiInputs) {
  const months = years * 12
  if (months <= 0 || principal < 0) return 0
  const monthlyRate = annualRate / 1200
  return monthlyRate === 0 ? principal / months : principal * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1)
}
