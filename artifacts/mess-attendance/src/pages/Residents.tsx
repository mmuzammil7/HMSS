import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useGetResidents, 
  useCreateResident, 
  useUpdateResident, 
  useDeleteResident,
  useToggleUnpaidBill,
  type Resident
} from "@workspace/api-client-react"
import { Plus, Pencil, Trash2, Lock, AlertCircle, CheckCircle2, Leaf, Drumstick } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { PinLoginModal } from "@/components/PinLoginModal"

export default function Residents() {
  const { data: residents = [], isLoading } = useGetResidents()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const { isAdmin } = useAuth()
  const pendingAction = useRef<(() => void) | null>(null)
  
  const [name, setName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [dietType, setDietType] = useState<"veg" | "non-veg">("veg")
  const [isActive, setIsActive] = useState(true)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/residents'] })

  const createMut = useCreateResident({ mutation: { onSuccess: () => { invalidate(); setIsDialogOpen(false); toast({ title: "Resident added!" }) } } })
  const updateMut = useUpdateResident({ mutation: { onSuccess: () => { invalidate(); setIsDialogOpen(false); toast({ title: "Resident updated!" }) } } })
  const deleteMut = useDeleteResident({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Resident deleted!" }) } } })
  const toggleUnpaidMut = useToggleUnpaidBill({ mutation: { onSuccess: () => { invalidate() } } })

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

  const openNew = () => requireAdmin(() => {
    setEditingId(null); setName(""); setRoomNumber(""); setDietType("veg"); setIsActive(true)
    setIsDialogOpen(true)
  })

  const openEdit = (r: Resident) => requireAdmin(() => {
    setEditingId(r.id); setName(r.name); setRoomNumber(r.roomNumber)
    setDietType((r.dietType ?? "veg") as "veg" | "non-veg"); setIsActive(r.isActive)
    setIsDialogOpen(true)
  })

  const handleDelete = (r: Resident) => requireAdmin(() => {
    if (confirm(`Delete ${r.name}? This cannot be undone.`)) deleteMut.mutate({ id: r.id })
  })

  const handleToggleUnpaid = (r: Resident) => requireAdmin(() => {
    toggleUnpaidMut.mutate({ id: r.id, data: { hasUnpaidBill: !r.hasUnpaidBill } })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name, roomNumber, dietType, isActive }
    if (editingId) updateMut.mutate({ id: editingId, data })
    else createMut.mutate({ data })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Residents</h1>
          <p className="text-muted-foreground mt-1">Manage hostel members and their diet preferences.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          {!isAdmin && <Lock className="w-4 h-4" />}
          {isAdmin && <Plus className="w-4 h-4" />}
          Add Resident
        </Button>
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-medium">Admin login required to add, edit, or delete residents.</p>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Room</th>
                <th className="px-6 py-4 font-medium">Diet</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Bill</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading residents...</td></tr>
              ) : residents.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No residents found. Add one to get started.</td></tr>
              ) : residents.map(r => (
                <tr key={r.id} className={cn(
                  "hover:bg-slate-50/50 transition-colors",
                  r.hasUnpaidBill && "bg-rose-50/40 hover:bg-rose-50/60"
                )}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{r.name}</span>
                      {r.hasUnpaidBill && (
                        <span className="text-xs bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{r.roomNumber}</td>
                  <td className="px-6 py-4">
                    {r.dietType === "veg" ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-medium w-fit">
                        <Leaf className="w-3 h-3" /> Veg
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full text-xs font-medium w-fit">
                        <Drumstick className="w-3 h-3" /> Non-Veg
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full border",
                      r.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleUnpaid(r)}
                      disabled={toggleUnpaidMut.isPending}
                      title={r.hasUnpaidBill ? "Mark as paid" : "Flag as unpaid"}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                        r.hasUnpaidBill
                          ? "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {r.hasUnpaidBill ? (
                        <><AlertCircle className="w-3 h-3" /> Unpaid</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3" /> Paid</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold font-display mb-4">{editingId ? "Edit Resident" : "Add Resident"}</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Room Number</label>
            <Input required value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 101" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Diet Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDietType("veg")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  dietType === "veg"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                <Leaf className="w-4 h-4" /> Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setDietType("non-veg")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  dietType === "non-veg"
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                <Drumstick className="w-4 h-4" /> Non-Vegetarian
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={e => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300"
            />
            <span className="text-sm font-medium">Active Member</span>
          </label>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
              {editingId ? "Save Changes" : "Add Resident"}
            </Button>
          </div>
        </form>
      </Dialog>

      {showLoginModal && (
        <PinLoginModal onSuccess={handleLoginSuccess} onCancel={() => { pendingAction.current = null; setShowLoginModal(false) }} />
      )}
    </motion.div>
  )
}
