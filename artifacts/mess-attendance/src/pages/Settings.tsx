import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react"
import { Save, Leaf, Drumstick, Coffee, Plus, Trash2, Pencil, X, KeyRound, Users, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

type Manager = { id: number; username: string; role: string }

export default function Settings() {
  const { data: settings, isLoading, refetch: refetchSettings } = useGetSettings()
  const { toast } = useToast()
  const { isAdmin, user } = useAuth()

  const [messName, setMessName] = useState("")
  const [vegDietRate, setVegDietRate] = useState(0)
  const [nonVegDietRate, setNonVegDietRate] = useState(0)
  const [breakfastRate, setBreakfastRate] = useState(0)
  const [currency, setCurrency] = useState("₹")

  const [managers, setManagers] = useState<Manager[]>([])
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [showAddManager, setShowAddManager] = useState(false)
  const [newManagerUsername, setNewManagerUsername] = useState("")
  const [newManagerPassword, setNewManagerPassword] = useState("")
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [editUsername, setEditUsername] = useState("")
  const [editPassword, setEditPassword] = useState("")

  const [residentUsername, setResidentUsername] = useState("resident")
  const [residentPin, setResidentPin] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    if (settings) {
      setMessName(settings.messName)
      setVegDietRate(settings.vegDietRate)
      setNonVegDietRate(settings.nonVegDietRate)
      setBreakfastRate(settings.breakfastRate)
      setCurrency(settings.currency)
      setResidentUsername((settings as any).residentUsername || "resident")
    }
  }, [settings])

  useEffect(() => {
    if (isAdmin) fetchManagers()
  }, [isAdmin])

  const fetchManagers = async () => {
    setLoadingManagers(true)
    try {
      const token = localStorage.getItem("messmate_token")
      const res = await fetch("/api/auth/managers", { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setManagers(await res.json())
    } finally {
      setLoadingManagers(false)
    }
  }

  const updateMut = useUpdateSettings({
    mutation: { onSuccess: () => toast({ title: "Settings saved" }) }
  })

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMut.mutate({ data: { messName, vegDietRate, nonVegDietRate, breakfastRate, currency } })
  }

  const authFetch = async (url: string, options: RequestInit) => {
    const token = localStorage.getItem("messmate_token")
    return fetch(url, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers as Record<string, string> || {}) } })
  }

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await authFetch("/api/auth/managers", {
      method: "POST",
      body: JSON.stringify({ username: newManagerUsername, password: newManagerPassword }),
    })
    if (res.ok) {
      toast({ title: "Manager added" })
      setNewManagerUsername(""); setNewManagerPassword("")
      setShowAddManager(false)
      fetchManagers()
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: d.error || "Failed to add manager", variant: "destructive" })
    }
  }

  const handleDeleteManager = async (id: number) => {
    const res = await authFetch(`/api/auth/managers/${id}`, { method: "DELETE" })
    if (res.ok) { toast({ title: "Manager removed" }); fetchManagers() }
  }

  const handleEditManager = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingManager) return
    const body: Record<string, string> = {}
    if (editUsername) body.username = editUsername
    if (editPassword) body.password = editPassword
    const res = await authFetch(`/api/auth/managers/${editingManager.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
    if (res.ok) {
      toast({ title: "Manager updated" })
      setEditingManager(null); setEditUsername(""); setEditPassword("")
      fetchManagers()
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: d.error || "Failed to update manager", variant: "destructive" })
    }
  }

  const handleResidentCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    const body: Record<string, string> = {}
    if (residentUsername) body.username = residentUsername
    if (residentPin) body.pin = residentPin
    const res = await authFetch("/api/auth/resident-credentials", { method: "PUT", body: JSON.stringify(body) })
    if (res.ok) {
      toast({ title: "Resident credentials updated" })
      setResidentPin("")
      refetchSettings()
    } else {
      toast({ title: "Failed to update", variant: "destructive" })
    }
  }

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" }); return
    }
    const res = await authFetch("/api/auth/admin-password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    if (res.ok) {
      toast({ title: "Password changed" })
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: d.error || "Failed to change password", variant: "destructive" })
    }
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
        <p className="text-sm text-slate-400 mt-0.5">Configure mess name, rates{isAdmin ? ", users and security" : ""}.</p>
      </div>

      <form onSubmit={handleSettingsSubmit} className="space-y-5">
        {isAdmin && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">General</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Hostel / Mess Name</label>
              <Input value={messName} onChange={e => setMessName(e.target.value)} required placeholder="e.g. Green Valley Hostel" className="rounded-xl h-10 max-w-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} required className="rounded-xl h-10 w-24" />
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Billing Rates</h2>
            <p className="text-xs text-slate-400 mt-1">Daily rates charged per person based on diet type.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <RateField label="Veg Diet Rate" sublabel="Per day · Vegetarian" icon={<Leaf className="w-4 h-4 text-emerald-600" />} iconBg="bg-emerald-50" value={vegDietRate} currency={currency} onChange={v => setVegDietRate(v)} />
            <RateField label="Non-Veg Diet Rate" sublabel="Per day · Non-vegetarian" icon={<Drumstick className="w-4 h-4 text-orange-500" />} iconBg="bg-orange-50" value={nonVegDietRate} currency={currency} onChange={v => setNonVegDietRate(v)} />
            <RateField label="Breakfast Only Rate" sublabel="Per day · All residents" icon={<Coffee className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50" value={breakfastRate} currency={currency} onChange={v => setBreakfastRate(v)} />
          </div>
        </div>

        <Button type="submit" disabled={updateMut.isPending} className="h-11 px-6 rounded-xl gap-2 shadow-sm">
          <Save className="w-4 h-4" />
          {updateMut.isPending ? "Saving…" : "Save Settings"}
        </Button>
      </form>

      {isAdmin && (
        <>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Mess Managers</h2>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddManager(v => !v)} className="rounded-xl gap-1.5 h-8 text-xs">
                {showAddManager ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddManager ? "Cancel" : "Add Manager"}
              </Button>
            </div>

            <AnimatePresence>
              {showAddManager && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddManager}
                  className="overflow-hidden"
                >
                  <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-200">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">New Manager</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={newManagerUsername} onChange={e => setNewManagerUsername(e.target.value)} required placeholder="Username" className="rounded-xl h-9 text-sm" />
                      <Input type="password" value={newManagerPassword} onChange={e => setNewManagerPassword(e.target.value)} required placeholder="Password" className="rounded-xl h-9 text-sm" />
                    </div>
                    <Button type="submit" size="sm" className="h-8 rounded-xl gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" /> Add Manager
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {loadingManagers ? (
              <div className="flex h-16 items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : managers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No managers added yet.</p>
            ) : (
              <div className="space-y-2">
                {managers.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                      {m.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.username}</p>
                      <p className="text-xs text-slate-400 capitalize">{m.role}</p>
                    </div>
                    <button onClick={() => { setEditingManager(m); setEditUsername(m.username); setEditPassword("") }} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteManager(m.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AnimatePresence>
              {editingManager && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleEditManager}
                  className="overflow-hidden"
                >
                  <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Edit: {editingManager.username}</p>
                      <button type="button" onClick={() => setEditingManager(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="New username" className="rounded-xl h-9 text-sm" />
                      <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="New password" className="rounded-xl h-9 text-sm" />
                    </div>
                    <Button type="submit" size="sm" className="h-8 rounded-xl gap-1.5 text-xs">
                      <Save className="w-3.5 h-3.5" /> Save Changes
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Resident Login</h2>
            </div>
            <p className="text-xs text-slate-400">All residents share the same username and 6-digit PIN to view attendance.</p>
            <form onSubmit={handleResidentCredentials} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Shared Username</label>
                  <Input value={residentUsername} onChange={e => setResidentUsername(e.target.value)} className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">6-Digit PIN</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={residentPin}
                    onChange={e => setResidentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter new PIN to change"
                    className="rounded-xl h-10"
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="h-9 rounded-xl gap-2 text-sm">
                <Save className="w-3.5 h-3.5" /> Update Resident Login
              </Button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Change Admin Password</h2>
            </div>
            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Current Password</label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="rounded-xl h-10 max-w-xs" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="rounded-xl h-10" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={cn("rounded-xl h-10", confirmPassword && newPassword !== confirmPassword && "border-rose-400")}
                  />
                </div>
              </div>
              <Button type="submit" size="sm" className="h-9 rounded-xl gap-2 text-sm">
                <KeyRound className="w-3.5 h-3.5" /> Change Password
              </Button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  )
}

function RateField({ label, sublabel, icon, iconBg, value, currency, onChange }: {
  label: string; sublabel: string; icon: React.ReactNode; iconBg: string
  value: number; currency: string; onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-700 leading-tight">{label}</p>
          <p className="text-[11px] text-slate-400">{sublabel}</p>
        </div>
      </div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{currency}</span>
        <Input type="number" step="0.01" min="0" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} required className="pl-8 rounded-xl h-10" />
      </div>
    </div>
  )
}
