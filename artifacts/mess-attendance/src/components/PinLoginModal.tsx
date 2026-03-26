import React, { useState, useRef, useEffect } from "react"
import { useVerifyPin, useSetPin, useHasPin } from "@workspace/api-client-react"
import { useAuth } from "@/contexts/AuthContext"
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface PinLoginModalProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function PinLoginModal({ onSuccess, onCancel }: PinLoginModalProps) {
  const { login } = useAuth()
  const { toast } = useToast()
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: hasPinData } = useHasPin()
  const isFirstTime = !hasPinData?.hasPin

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const verifyMut = useVerifyPin({
    mutation: {
      onSuccess: (data) => {
        if (data.valid) {
          login()
          onSuccess?.()
          toast({ title: "Admin access granted" })
        } else {
          setError("Incorrect PIN. Please try again.")
          setPin("")
          inputRef.current?.focus()
        }
      }
    }
  })

  const setPinMut = useSetPin({
    mutation: {
      onSuccess: () => {
        login()
        onSuccess?.()
        toast({ title: "PIN set! Admin access granted." })
      },
      onError: () => {
        setError("Failed to set PIN. Try again.")
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!pin || pin.length < 4) {
      setError("PIN must be at least 4 digits.")
      return
    }
    if (isFirstTime) {
      setPinMut.mutate({ data: { newPin: pin } })
    } else {
      verifyMut.mutate({ data: { pin } })
    }
  }

  const isPending = verifyMut.isPending || setPinMut.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {isFirstTime ? <ShieldCheck className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold">
            {isFirstTime ? "Set Admin PIN" : "Admin Login"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isFirstTime
              ? "Create a PIN to protect admin features"
              : "Enter your PIN to access admin features"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              type={showPin ? "text" : "password"}
              inputMode="numeric"
              placeholder={isFirstTime ? "Create a 4+ digit PIN" : "Enter PIN"}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError("") }}
              maxLength={10}
              className="text-center text-2xl tracking-widest pr-12 h-14"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-rose-600 text-center font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-base" disabled={isPending || !pin}>
            {isPending ? "Verifying..." : isFirstTime ? "Set PIN & Enter" : "Login"}
          </Button>

          {onCancel && (
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}
