import React, { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { useGetSettings, useUpdateSettings, useSetPin, useHasPin } from "@workspace/api-client-react"
import { Save, Store, MessageCircle, Lock, Eye, EyeOff, ShieldCheck, ExternalLink } from "lucide-react"
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
  const [dietRate, setDietRate] = useState(0)
  const [breakfastRate, setBreakfastRate] = useState(0)
  const [currency, setCurrency] = useState("₹")
  const [whatsappApiKey, setWhatsappApiKey] = useState("")
  const [whatsappSender, setWhatsappSender] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)

  // PIN change form
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [showPins, setShowPins] = useState(false)

  useEffect(() => {
    if (settings) {
      setMessName(settings.messName)
      setDietRate(settings.dietRatePerDay)
      setBreakfastRate(settings.breakfastRate)
      setCurrency(settings.currency)
      setWhatsappApiKey(settings.whatsappApiKey ?? "")
      setWhatsappSender(settings.whatsappSender ?? "")
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
        data: { messName, dietRatePerDay: dietRate, breakfastRate, currency, whatsappApiKey, whatsappSender }
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
          <p className="text-muted-foreground mt-1">Configure mess info, rates, and integrations.</p>
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

      {/* General Settings */}
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

            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-semibold text-lg">Billing Rates</h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Diet Rate (Per Day)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={dietRate} onChange={e => setDietRate(parseFloat(e.target.value))} required className="pl-8" disabled={!isAdmin} />
                  </div>
                  <p className="text-xs text-muted-foreground">Applied for 'Present' and half for 'P/2'.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Breakfast Only Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-muted-foreground">{currency}</span>
                    <Input type="number" step="0.01" value={breakfastRate} onChange={e => setBreakfastRate(parseFloat(e.target.value))} required className="pl-8" disabled={!isAdmin} />
                  </div>
                  <p className="text-xs text-muted-foreground">Fixed rate for 'Breakfast' days.</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Config */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-emerald-600 mb-2">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-semibold text-lg">WhatsApp Integration</h3>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 space-y-2">
                <p className="font-semibold">How to get your API key (Free):</p>
                <ol className="list-decimal list-inside space-y-1 text-emerald-700">
                  <li>Send "I allow callmebot to send me messages" to <strong>+34 644 48 26 25</strong> on WhatsApp</li>
                  <li>You'll receive your personal API key within 2 minutes</li>
                  <li>Enter your phone number (with country code, no +) and the API key below</li>
                </ol>
                <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-600 hover:underline font-medium mt-2">
                  Full setup guide <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Your WhatsApp Number (with country code)</label>
                  <Input
                    value={whatsappSender}
                    onChange={e => setWhatsappSender(e.target.value)}
                    placeholder="e.g. 919876543210"
                    disabled={!isAdmin}
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">This is YOUR number (the manager's), not the residents'. Bills are sent from this account.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">CallMeBot API Key</label>
                  <div className="relative max-w-md">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={whatsappApiKey}
                      onChange={e => setWhatsappApiKey(e.target.value)}
                      placeholder="Your API key"
                      disabled={!isAdmin}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {settings?.hasWhatsapp && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    WhatsApp is configured and ready
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={updateMut.isPending || !isAdmin} className="gap-2 h-12 px-8 text-base">
                <Save className="w-5 h-5" />
                {updateMut.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PIN Management */}
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
                <div className="relative">
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
                <button
                  type="button"
                  onClick={() => setShowPins(!showPins)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
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
