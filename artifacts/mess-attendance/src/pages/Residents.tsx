import React, { useState } from "react"
import { motion } from "framer-motion"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useGetResidents, 
  useCreateResident, 
  useUpdateResident, 
  useDeleteResident,
  type Resident
} from "@workspace/api-client-react"
import { Plus, Pencil, Trash2, Phone, Lock } from "lucide-react"
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
  
  const [name, setName] = useState("")
  const [roomNumber, setRoomNumber] = useState("")
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [isActive, setIsActive] = useState(true)

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['/api/residents'] })

  const createMut = useCreateResident({ mutation: { onSuccess: () => { invalidate(); setIsDialogOpen(false); toast({title:"Resident added!"}) } } })
  const updateMut = useUpdateResident({ mutation: { onSuccess: () => { invalidate(); setIsDialogOpen(false); toast({title:"Resident updated!"}) } } })
  const deleteMut = useDeleteResident({ mutation: { onSuccess: () => { invalidate(); toast({title:"Resident deleted!"}) } } })

  const requireAdmin = (fn: () => void) => {
    if (!isAdmin) { setShowLoginModal(true); return }
    fn()
  }

  const openNew = () => requireAdmin(() => {
    setEditingId(null); setName(""); setRoomNumber(""); setWhatsappNumber(""); setIsActive(true);
    setIsDialogOpen(true);
  })

  const openEdit = (r: Resident) => requireAdmin(() => {
    setEditingId(r.id); setName(r.name); setRoomNumber(r.roomNumber); setWhatsappNumber(r.whatsappNumber); setIsActive(r.isActive);
    setIsDialogOpen(true);
  })

  const handleDelete = (r: Resident) => requireAdmin(() => {
    if (confirm(`Delete ${r.name}? This cannot be undone.`)) deleteMut.mutate({ id: r.id })
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name, roomNumber, whatsappNumber, isActive }
    if (editingId) updateMut.mutate({ id: editingId, data })
    else createMut.mutate({ data })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Residents</h1>
          <p className="text-muted-foreground mt-1">Manage hostel members and their contact details.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          {!isAdmin && <Lock className="w-4 h-4" />}
          {isAdmin ? <Plus className="w-4 h-4" /> : null}
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
                <th className="px-6 py-4 font-medium">WhatsApp</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading residents...</td></tr>
              ) : residents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No residents found. Add one to get started.</td></tr>
              ) : residents.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{r.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{r.roomNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      {r.whatsappNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-full border",
                      r.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {r.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" size="icon" 
                        onClick={() => handleDelete(r)} 
                        className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
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
            <label className="text-sm font-medium">WhatsApp Number (with country code, no +)</label>
            <Input required value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="e.g. 919876543210" />
            <p className="text-xs text-muted-foreground">India: 91 + 10 digit number. Example: 919876543210</p>
          </div>

          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={e => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
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
        <PinLoginModal onSuccess={() => setShowLoginModal(false)} onCancel={() => setShowLoginModal(false)} />
      )}
    </motion.div>
  )
}
