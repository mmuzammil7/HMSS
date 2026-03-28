import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react"
import { Save, Store, Leaf, Drumstick } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
      onSuccess: () => toast({ title: "Settings saved successfully!" })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMut.mutate({
      data: { messName, vegDietRate, nonVegDietRate, breakfastRate, currency }
    })
  }

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading settings...</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure mess info and billing rates.</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 pb-6 border-b">
              <div className="flex items-center gap-3 text-primary mb-2">
                <Store className="w-5 h-5" />
                <h3 className="font-semibold text-lg">General Info</h3>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Hostel / Mess Name</label>
                <Input value={messName} onChange={e => setMessName(e.target.value)} required className="max-w-md" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
                <Input value={currency} onChange={e => setCurrency(e.target.value)} required className="max-w-[100px]" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Billing Rates</h3>
              <p className="text-sm text-muted-foreground -mt-2">Set different daily rates for vegetarian and non-vegetarian residents.</p>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" /> Veg Diet Rate (Per Day)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={vegDietRate} onChange={e => setVegDietRate(parseFloat(e.target.value))} required className="pl-8" />
                  </div>
                  <p className="text-xs text-muted-foreground">Applied for vegetarian residents.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Drumstick className="w-4 h-4 text-orange-500" /> Non-Veg Diet Rate (Per Day)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={nonVegDietRate} onChange={e => setNonVegDietRate(parseFloat(e.target.value))} required className="pl-8" />
                  </div>
                  <p className="text-xs text-muted-foreground">Applied for non-vegetarian residents.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Breakfast Only Rate (Per Day)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={breakfastRate} onChange={e => setBreakfastRate(parseFloat(e.target.value))} required className="pl-8" />
                  </div>
                  <p className="text-xs text-muted-foreground">Fixed rate for 'Breakfast Only' days (same for all).</p>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={updateMut.isPending} className="gap-2 h-12 px-8 text-base">
                  <Save className="w-5 h-5" />
                  {updateMut.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
