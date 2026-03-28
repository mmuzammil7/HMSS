import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react"
import { Save, Leaf, Drumstick, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings()
  const { toast } = useToast()

  const [messName, setMessName] = useState("")
  const [vegDietRate, setVegDietRate] = useState(0)
  const [nonVegDietRate, setNonVegDietRate] = useState(0)
  const [breakfastRate, setBreakfastRate] = useState(0)
  const [currency, setCurrency] = useState("₹")

  useEffect(() => {
    if (settings) {
      setMessName(settings.messName)
      setVegDietRate(settings.vegDietRate)
      setNonVegDietRate(settings.nonVegDietRate)
      setBreakfastRate(settings.breakfastRate)
      setCurrency(settings.currency)
    }
  }, [settings])

  const updateMut = useUpdateSettings({
    mutation: {
      onSuccess: () => toast({ title: "Settings saved" })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMut.mutate({ data: { messName, vegDietRate, nonVegDietRate, breakfastRate, currency } })
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configure your mess name, currency, and daily billing rates.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">General</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Hostel / Mess Name</label>
            <Input
              value={messName}
              onChange={e => setMessName(e.target.value)}
              required
              placeholder="e.g. Green Valley Hostel"
              className="rounded-xl h-10 max-w-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
            <Input
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              required
              className="rounded-xl h-10 w-24"
            />
          </div>
        </div>

        {/* Billing Rates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Billing Rates</h2>
            <p className="text-xs text-slate-400 mt-1">Daily rates charged per person based on diet type and meal type.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <RateField
              label="Veg Diet Rate"
              sublabel="Per day · Vegetarian"
              icon={<Leaf className="w-4 h-4 text-emerald-600" />}
              iconBg="bg-emerald-50"
              value={vegDietRate}
              currency={currency}
              onChange={v => setVegDietRate(v)}
            />
            <RateField
              label="Non-Veg Diet Rate"
              sublabel="Per day · Non-vegetarian"
              icon={<Drumstick className="w-4 h-4 text-orange-500" />}
              iconBg="bg-orange-50"
              value={nonVegDietRate}
              currency={currency}
              onChange={v => setNonVegDietRate(v)}
            />
            <RateField
              label="Breakfast Only Rate"
              sublabel="Per day · All residents"
              icon={<Coffee className="w-4 h-4 text-amber-600" />}
              iconBg="bg-amber-50"
              value={breakfastRate}
              currency={currency}
              onChange={v => setBreakfastRate(v)}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={updateMut.isPending}
          className="h-11 px-6 rounded-xl gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {updateMut.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </form>
    </motion.div>
  )
}

function RateField({
  label, sublabel, icon, iconBg, value, currency, onChange
}: {
  label: string; sublabel: string; icon: React.ReactNode; iconBg: string;
  value: number; currency: string; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 leading-tight">{label}</p>
          <p className="text-[11px] text-slate-400">{sublabel}</p>
        </div>
      </div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{currency}</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          required
          className="pl-8 rounded-xl h-10"
        />
      </div>
    </div>
  )
}
