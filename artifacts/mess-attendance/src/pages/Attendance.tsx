import React, { useState } from "react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useQueryClient } from "@tanstack/react-query"
import { 
  useGetAttendance, 
  useGetResidents, 
  useMarkAttendance, 
  useBulkMarkAttendance,
  AttendanceRecordStatus 
} from "@workspace/api-client-react"
import { Calendar as CalendarIcon, Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function Attendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: residents = [], isLoading: loadingRes } = useGetResidents()
  const { data: attendance = [], isLoading: loadingAtt } = useGetAttendance({ date })
  
  const markMutation = useMarkAttendance({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/attendance'] }),
      onError: () => toast({ title: "Error marking attendance", variant: "destructive" })
    }
  })

  const bulkMutation = useBulkMarkAttendance({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/attendance'] })
        toast({ title: "Bulk attendance saved!" })
      }
    }
  })

  const handleMark = (residentId: number, status: AttendanceRecordStatus) => {
    markMutation.mutate({ data: { residentId, date, status } })
  }

  const handleBulkMark = (status: AttendanceRecordStatus) => {
    const entries = activeResidents.map(r => ({ residentId: r.id, status }))
    bulkMutation.mutate({ data: { date, entries } })
  }

  const activeResidents = residents.filter(r => r.isActive)

  if (loadingRes || loadingAtt) return <div className="p-8 text-center animate-pulse">Loading attendance data...</div>

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground mt-1">Mark daily attendance for {activeResidents.length} active residents.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-card p-2 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-2 pl-2">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="border-0 shadow-none ring-0 focus-visible:ring-0 w-auto bg-transparent"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex flex-wrap gap-2 justify-between items-center">
          <span className="text-sm font-medium text-slate-600">Bulk Actions:</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkMark('present')} disabled={bulkMutation.isPending}>
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkMark('half')} disabled={bulkMutation.isPending}>
              Mark All P/2
            </Button>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {activeResidents.map(resident => {
            const record = attendance.find(a => a.residentId === resident.id)
            const status = record?.status
            
            return (
              <div key={resident.id} className="p-4 md:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="font-semibold text-foreground">{resident.name}</p>
                  <p className="text-sm text-muted-foreground">Room: {resident.roomNumber}</p>
                </div>
                
                <div className="flex bg-slate-100/50 p-1 rounded-xl w-full sm:w-auto">
                  <StatusButton 
                    label="Present" 
                    active={status === 'present'} 
                    colorClass="bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-200"
                    onClick={() => handleMark(resident.id, 'present')}
                  />
                  <StatusButton 
                    label="P/2" 
                    active={status === 'half'} 
                    colorClass="bg-amber-100 text-amber-800 shadow-sm border border-amber-200"
                    onClick={() => handleMark(resident.id, 'half')}
                  />
                  <StatusButton 
                    label="Brkfst" 
                    active={status === 'breakfast'} 
                    colorClass="bg-sky-100 text-sky-800 shadow-sm border border-sky-200"
                    onClick={() => handleMark(resident.id, 'breakfast')}
                  />
                  <StatusButton 
                    label="Absent" 
                    active={status === 'absent'} 
                    colorClass="bg-rose-100 text-rose-800 shadow-sm border border-rose-200"
                    onClick={() => handleMark(resident.id, 'absent')}
                  />
                </div>
              </div>
            )
          })}
          {activeResidents.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No active residents found. Add them in the Residents tab.
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function StatusButton({ label, active, colorClass, onClick }: { label: string, active: boolean, colorClass: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
        active ? colorClass : "text-slate-500 hover:bg-slate-200/50 border border-transparent"
      )}
    >
      {label}
    </button>
  )
}
