import { useMemo, useState } from "react"
import { ArrowRightLeft, Ruler } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const units = {
  Length: {
    m: { label: "Meters", factor: 1 },
    km: { label: "Kilometers", factor: 1000 },
    ft: { label: "Feet", factor: 0.3048 },
    mi: { label: "Miles", factor: 1609.344 },
  },
  Mass: {
    kg: { label: "Kilograms", factor: 1 },
    g: { label: "Grams", factor: 0.001 },
    lb: { label: "Pounds", factor: 0.45359237 },
    oz: { label: "Ounces", factor: 0.028349523125 },
  },
} as const

type Category = keyof typeof units | "Temperature"

function convertTemperature(value: number, from: string, to: string) {
  const celsius =
    from === "°C"
      ? value
      : from === "°F"
        ? ((value - 32) * 5) / 9
        : value - 273.15
  return to === "°C"
    ? celsius
    : to === "°F"
      ? (celsius * 9) / 5 + 32
      : celsius + 273.15
}

export function UnitConverter() {
  const [category, setCategory] = useState<Category>("Length")
  const [from, setFrom] = useState("m")
  const [to, setTo] = useState("km")
  const [value, setValue] = useState("1")
  const options =
    category === "Temperature"
      ? ["°C", "°F", "K"]
      : Object.keys(units[category])
  const result = useMemo(() => {
    const amount = Number(value)
    if (!Number.isFinite(amount)) return "—"
    if (category === "Temperature") return convertTemperature(amount, from, to)
    const table = units[category] as Record<
      string,
      { label: string; factor: number }
    >
    return (amount * table[from]!.factor) / table[to]!.factor
  }, [category, from, to, value])
  const changeCategory = (next: Category) => {
    setCategory(next)
    setFrom(next === "Temperature" ? "°C" : "m")
    setTo(next === "Temperature" ? "°F" : "km")
  }
  const label = (unit: string) => {
    if (category === "Temperature") return unit
    const table = units[category] as Record<
      string,
      { label: string; factor: number }
    >
    return table[unit]?.label ?? unit
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>Unit converter</CardTitle>
        <CardDescription>
          Convert common length, mass, and temperature units.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="unit-category">Category</Label>
          <select
            id="unit-category"
            value={category}
            onChange={(event) => changeCategory(event.target.value as Category)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option>Length</option>
            <option>Mass</option>
            <option>Temperature</option>
          </select>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <Label htmlFor="unit-value">Value</Label>
            <Input
              id="unit-value"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <button
            type="button"
            aria-label="Swap units"
            onClick={() => {
              setFrom(to)
              setTo(from)
            }}
            className="grid size-9 place-items-center rounded-md border text-muted-foreground hover:bg-muted"
          >
            <ArrowRightLeft className="size-4" />
          </button>
          <div className="space-y-2">
            <Label htmlFor="unit-result">Result</Label>
            <output
              id="unit-result"
              className="flex h-9 items-center rounded-md border bg-muted/30 px-3 font-mono text-sm"
            >
              {Number(result).toLocaleString(undefined, {
                maximumSignificantDigits: 8,
              })}{" "}
              {label(to)}
            </output>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <UnitSelect
            id="unit-from"
            label="From"
            value={from}
            options={options}
            unitLabel={label}
            onChange={setFrom}
          />
          <UnitSelect
            id="unit-to"
            label="To"
            value={to}
            options={options}
            unitLabel={label}
            onChange={setTo}
          />
        </div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Ruler className="size-3.5" />
          Conversions are calculated locally.
        </p>
      </CardContent>
    </Card>
  )
}

function UnitSelect({
  id,
  label,
  value,
  options,
  unitLabel,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: string[]
  unitLabel: (unit: string) => string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {unitLabel(option)}
          </option>
        ))}
      </select>
    </div>
  )
}
