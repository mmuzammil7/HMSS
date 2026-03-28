import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetResidents,
  useCreateResident,
  useUpdateResident,
  useDeleteResident,
  useToggleUnpaidBill,
  type Resident
} from "@workspace/api-client-react"
import { Plus, Pencil, Trash2, Leaf, Drumstick, Users, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

export default function Residents() {
  const { data: residents = [], isLoading } = useGetResidents()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [dietType, setDietType] = useState<"veg" | "non-veg">("veg")
  const [isActive, setIsActive] = useState(true)

  const queryClient = useQueryClient()
  const { toast } = useToast()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/residents'] })

  const createMut = useCreateResident({ mutation: { onSuccess: () => { invalidate(); closeDialog(); toast({ title: "Resident added" }) } } })
  const updateMut = useUpdateResident({ mutation: { onSuccess: () => { invalidate(); closeDialog(); toast({ title: "Resident updated" }) } } })
  const deleteMut = useDeleteResident({ mutation: { onSuccess: () => { invalidate(); toast({ title: "Resident removed" }) } } })
  const toggleUnpaidMut = useToggleUnpaidBill({ mutation: { onSuccess: () => invalidate() } })

  const closeDialog = () => setIsDialogOpen(false)

  const openNew = () => {
    setEditingId(null); setName(""); setRoomNumber(""); setDietType("veg"); setIsActive(true)
    setIsDialogOpen(true)
  }

  const openEdit = (r: Resident) => {
    setEditingId(r.id); setName(r.name); setRoomNumber(r.roomNumber)
    setDietType((r.dietType ?? "veg") as "veg" | "non-veg"); setIsActive(r.isActive)
    setIsDialogOpen(true)
  }

  const handleDelete = (r: Resident) => {
    if (confirm(`Delete ${r.name}? This cannot be undone.`)) deleteMut.mutate({ id: r.id })
  }

  const handleToggleUnpaid = (r: Resident) => {
    toggleUnpaidMut.mutate({ id: r.id, data: { hasUnpaidBill: !r.hasUnpaidBill } })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name, roomNumber, dietType, isActive }
    if (editingId) updateMut.mutate({ id: editingId, data })
    else createMut.mutate({ data })
  }

  const active = residents.filter(r => r.isActive).length
  const inactive = residents.filter(r => !r.isActive).length
  const unpaid = residents.filter(r => r.hasUnpaidBill).length

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Residents</h1>
          <p className="text-sm text-slate-400 mt-0.5">{active} active · {inactive} inactive{unpaid > 0 ? ` · ${unpaid} unpaid` : ''}</p>
        </div>
        <Button onClick={openNew} className="gap-2 rounded-xl h-10 px-4 text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Add Resident
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : residents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No residents yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3.5">Resident</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 hidden sm:table-cell">Room</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5">Diet</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">Status</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Bill</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {residents.map(r => (
                <tr
                  key={r.id}
                  className={cn(
                    "border-b border-slate-50 last:border-0 transition-colors",
                    r.hasUnpaidBill ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50/60"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                        r.dietType === 'veg' ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                      )}>
                        {getInitials(r.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                        {r.hasUnpaidBill && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-medium">
                            <AlertCircle className="w-2.5 h-2.5" /> Unpaid bill
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-500">{r.roomNumber}</span>
                  </td>
                  <td className="px-4 py-4">
                    {r.dietType === "veg" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Leaf className="w-3 h-3" /> Veg
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                        <Drumstick className="w-3 h-3" /> Non-Veg
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full border",
                      r.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <button
                      onClick={() => handleToggleUnpaid(r)}
                      disabled={toggleUnpaidMut.isPending}
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors",
                        r.hasUnpaidBill
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {r.hasUnpaidBill ? "Mark Paid" : "Paid"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/8 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              onClick={closeDialog}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                  <h2 className="font-display font-bold text-lg text-slate-900">
                    {editingId ? "Edit Resident" : "Add Resident"}
                  </h2>
                  <button
                    onClick={closeDialog}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <Input
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Room Number</label>
                    <Input
                      required
                      value={roomNumber}
                      onChange={e => setRoomNumber(e.target.value)}
                      placeholder="e.g. 101"
                      className="rounded-xl h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Diet Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDietType("veg")}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
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
                          "flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                          dietType === "non-veg"
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300"
                        )}
                      >
                        <Drumstick className="w-4 h-4" /> Non-Veg
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Active Member</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl h-10"
                      onClick={closeDialog}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 rounded-xl h-10"
                      disabled={createMut.isPending || updateMut.isPending}
                    >
                      {editingId ? "Save Changes" : "Add Resident"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
