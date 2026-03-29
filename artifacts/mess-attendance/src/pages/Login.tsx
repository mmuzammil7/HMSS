import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, Briefcase, Users, ArrowLeft, Eye, EyeOff, Utensils } from "lucide-react"
import { useAuth, type UserRole } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type RoleOption = { role: UserRole; label: string; desc: string; icon: React.ReactNode; color: string }

const ROLES: RoleOption[] = [
  {
    role: "admin",
    label: "Admin",
    desc: "Full access — settings, users, billing",
    icon: <ShieldCheck className="w-6 h-6" />,
    color: "bg-[hsl(162,38%,11%)] text-white",
  },
  {
    role: "manager",
    label: "Mess Manager",
    desc: "Attendance, residents, billing & rates",
    icon: <Briefcase className="w-6 h-6" />,
    color: "bg-amber-600 text-white",
  },
  {
    role: "resident",
    label: "Resident",
    desc: "View your attendance with shared PIN",
    icon: <Users className="w-6 h-6" />,
    color: "bg-sky-600 text-white",
  },
]

export default function Login() {
  const { login } = useAuth()
  const [selected, setSelected] = useState<RoleOption | null>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const selectRole = (r: RoleOption) => {
    setSelected(r)
    setUsername(r.role === "resident" ? "resident" : "")
    setPassword("")
    setError("")
  }

  const handleBack = () => {
    setSelected(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      await login(selected.role, username, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">MessMate</h1>
          <p className="text-sm text-slate-400 mt-1">Hostel Mess Management</p>
        </div>

        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-center text-sm font-medium text-slate-500 mb-4">Choose how you want to sign in</p>
              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => selectRole(r)}
                    className="w-full flex items-center gap-4 p-4 bg-[hsl(35,30%,99%)] border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.color}`}>
                      {r.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                    </div>
                    <div className="text-slate-300 group-hover:text-slate-400 transition-colors">›</div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-[hsl(35,30%,99%)] border border-stone-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected.color}`}>
                    {selected.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Sign in as {selected.label}</p>
                    <p className="text-xs text-slate-400">{selected.desc}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Username</label>
                    {selected.role === "resident" ? (
                      <div className="h-10 px-3 flex items-center bg-stone-100 border border-stone-200 rounded-xl text-sm text-slate-500">
                        resident <span className="ml-2 text-xs text-slate-400">(shared for all residents)</span>
                      </div>
                    ) : (
                      <Input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        autoFocus
                        placeholder={selected.role === "admin" ? "admin" : "manager username"}
                        className="rounded-xl h-10"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      {selected.role === "resident" ? "6-Digit PIN" : "Password"}
                    </label>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoFocus={selected.role === "resident"}
                        placeholder={selected.role === "resident" ? "6-digit PIN" : "••••••••"}
                        maxLength={selected.role === "resident" ? 6 : undefined}
                        inputMode={selected.role === "resident" ? "numeric" : undefined}
                        className="rounded-xl h-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl gap-2"
                  >
                    {loading ? "Signing in…" : `Sign in as ${selected.label}`}
                  </Button>
                </form>
              </div>

              <button
                onClick={handleBack}
                className="mt-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Back to role selection
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
