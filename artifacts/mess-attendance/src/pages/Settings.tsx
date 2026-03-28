import React, { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { useGetSettings, useUpdateSettings, useSetPin, useHasPin } from "@workspace/api-client-react"
import { Save, Store, Lock, Eye, EyeOff, ShieldCheck, Leaf, Drumstick } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { PinLoginModal } from "@/components/PinLoginModal"

export default function Settings() {
  const { isAdmin } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)
  const { data: settings, isLoading } = useGetSettings()
  const { data: hasPinData } = useHasPin()
  const { toast } = useToast()
  
  const [messName, setMessName] = useState("")
  const [vegDietRate, setVegDietRate] = useState(0)
  const [nonVegDietRate, setNonVegDietRate] = useState(0)
  const [breakfastRate, setBreakfastRate] = useState(0)
  const [currency, setCurrency] = useState("₹")

  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [showPins, setShowPins] = useState(false)

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

  const setPinMut = useSetPin({
    mutation: {
      onSuccess: () => {
        toast({ title: "PIN updated successfully!" })
        setCurrentPin(""); setNewPin(""); setConfirmPin(""); setPinError("")
      },
      onError: (err: any) => {
        setPinError(err?.message ?? "Failed to update PIN")
      }
    }
  })

  const requireAdmin = (fn: () => void) => {
    if (!isAdmin) {
      pendingAction.current = fn
      setShowLoginModal(true)
      return
    }
    fn()
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
    const action = pendingAction.current
    pendingAction.current = null
    if (action) action()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requireAdmin(() => {
      updateMut.mutate({
        data: { messName, vegDietRate, nonVegDietRate, breakfastRate, currency }
      })
    })
  }

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPinError("")
    if (newPin.length < 4) { setPinError("PIN must be at least 4 digits."); return }
    if (newPin !== confirmPin) { setPinError("New PINs do not match."); return }
    requireAdmin(() => {
      setPinMut.mutate({ data: { currentPin: hasPinData?.hasPin ? currentPin : undefined, newPin } })
    })
  }

  if (isLoading) return <div className="p-8 text-center animate-pulse">Loading settings...</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure mess info, billing rates, and security.</p>
        </div>
        {!isAdmin && (
          <Button variant="outline" onClick={() => setShowLoginModal(true)} className="gap-2">
            <Lock className="w-4 h-4" /> Admin Login
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium">Admin login required to change settings.</p>
        </div>
      )}

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
                <Input value={messName} onChange={e => setMessName(e.target.value)} required className="max-w-md" disabled={!isAdmin} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
                <Input value={currency} onChange={e => setCurrency(e.target.value)} required className="max-w-[100px]" disabled={!isAdmin} />
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
                    <Input type="number" step="0.01" value={vegDietRate} onChange={e => setVegDietRate(parseFloat(e.target.value))} required className="pl-8" disabled={!isAdmin} />
                  </div>
                  <p className="text-xs text-muted-foreground">Applied for vegetarian residents.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Drumstick className="w-4 h-4 text-orange-500" /> Non-Veg Diet Rate (Per Day)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={nonVegDietRate} onChange={e => setNonVegDietRate(parseFloat(e.target.value))} required className="pl-8" disabled={!isAdmin} />
                  </div>
                  <p className="text-xs text-muted-foreground">Applied for non-vegetarian residents.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Breakfast Only Rate (Per Day)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={breakfastRate} onChange={e => setBreakfastRate(parseFloat(e.target.value))} required className="pl-8" disabled={!isAdmin} />
                  </div>
                  <p className="text-xs text-muted-foreground">Fixed rate for 'Breakfast Only' days (same for all).</p>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={updateMut.isPending || !isAdmin} className="gap-2 h-12 px-8 text-base">
                  <Save className="w-5 h-5" />
                  {updateMut.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Admin PIN</h3>
            {hasPinData?.hasPin ? (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">Set</span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-medium">Not Set</span>
            )}
          </div>

          <form onSubmit={handlePinChange} className="space-y-4 max-w-sm">
            {hasPinData?.hasPin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Current PIN</label>
                <Input
                  type={showPins ? "text" : "password"}
                  inputMode="numeric"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter current PIN"
                  maxLength={10}
                  disabled={!isAdmin}
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{hasPinData?.hasPin ? "New PIN" : "Set PIN"}</label>
              <div className="relative">
                <Input
                  type={showPins ? "text" : "password"}
                  inputMode="numeric"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="4+ digit PIN"
                  maxLength={10}
                  disabled={!isAdmin}
                  className="pr-12"
                />
                <button type="button" onClick={() => setShowPins(!showPins)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPins ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Confirm PIN</label>
              <Input
                type={showPins ? "text" : "password"}
                inputMode="numeric"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Repeat PIN"
                maxLength={10}
                disabled={!isAdmin}
              />
            </div>
            {pinError && <p className="text-sm text-rose-600 font-medium">{pinError}</p>}
            <Button type="submit" variant="outline" disabled={setPinMut.isPending || !isAdmin} className="gap-2">
              <Lock className="w-4 h-4" />
              {setPinMut.isPending ? "Updating..." : hasPinData?.hasPin ? "Change PIN" : "Set PIN"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showLoginModal && (
        <PinLoginModal onSuccess={handleLoginSuccess} onCancel={() => { pendingAction.current = null; setShowLoginModal(false) }} />
      )}
    </motion.div>
  )
}
